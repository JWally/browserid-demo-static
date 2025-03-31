// lib/stacks/app-stack.ts
import * as cdk from "aws-cdk-lib";
import * as events from "aws-cdk-lib/aws-events";
import * as targets from "aws-cdk-lib/aws-events-targets";
import * as s3 from "aws-cdk-lib/aws-s3";

import { Construct } from "constructs";

import * as sns from "aws-cdk-lib/aws-sns";
import * as iam from "aws-cdk-lib/aws-iam";

import { LambdaConstruct } from "../constructs/lambda";
import { ApiGatewayConstruct } from "../constructs/api";
import { DomainConstruct } from "../constructs/domain";
import { WafConstruct } from "../constructs/waf";
import { WARMUP_EVENT } from "../../src-lambda/helpers/constants";
import { StaticSiteConstruct } from "../constructs/static-site";

import { ProcessorModel } from "../constructs/models/processor";
import { AthenaConstruct } from "../constructs/athena";
import { TMX_TABLE_COLUMNS, OAK_TABLE_COLUMNS } from "../helpers/constants";

interface AppStackProps extends cdk.StackProps {
  environment: string;
  stackName: string;
  rootDomain: string;
  stage: string;
  region: string;
  account: string;
  siteDomains?: string[];
}

export class TheStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: AppStackProps) {
    super(scope, id, props);
    const { environment, stackName, rootDomain, stage, region, siteDomains } =
      props;

    // Create Lambda functions
    const lambdaConstruct = new LambdaConstruct(this, "Lambda", {
      environment,
      stackName,
      stage,
      projectName: id,
    });

    // Create API Gateway
    const apiGateway = new ApiGatewayConstruct(
      this,
      "Api",
      lambdaConstruct,
      stackName,
    );

    // Add WAF
    new WafConstruct(this, "Waf", {
      environment,
      apiGateway: apiGateway.api,
    });

    // Create custom domain and map it to API Gateway
    new DomainConstruct(this, "Domain", {
      stackName,
      rootDomain,
      stage,
      api: apiGateway.api,
      region,
    });

    // Static Site Construct From Loops
    if (!siteDomains || siteDomains.length === 0) {
      throw new Error("SITE DOMAINS NOT LOADED - EXITING");
    }
    siteDomains?.forEach((domain: string) => {
      new StaticSiteConstruct(this, `static-${stage}-${domain}`, {
        customDomain: `${stage}.${domain}`,
        rootDomain: domain,
      });
    });

    /// ///////////////////////////////////////////////////////////////////////
    ///
    ///  LAMBDA HEATERS
    ///
    /// ///////////////////////////////////////////////////////////////////////

    // These ping the lambdas every minute to reduce the number of cold starts

    // Warmup rule
    const warmupRule = new events.Rule(this, "WarmupRule", {
      schedule: events.Schedule.rate(cdk.Duration.minutes(1)), // minimum is 1 minute
    });

    // Add both functions as targets to the rule
    warmupRule.addTarget(
      new targets.LambdaFunction(lambdaConstruct.checkoutFunction, {
        event: events.RuleTargetInput.fromObject(WARMUP_EVENT),
      }),
    );

    /// ///////////////////////////////////////////////////////////////////////
    ///
    ///  CHECKOUT SNS TOPIC CREATION AND ASSIGNMENT
    ///
    /// ///////////////////////////////////////////////////////////////////////

    // 1) Create WEB-SNS Topic and set ARN in Lambda
    const checkoutTopic = new sns.Topic(this, `${stackName}-checkout-topic`, {
      displayName: `${stackName}-checkout-topic`,
    });

    // 2) Tell web function HOW to publish to the SNS Topic
    lambdaConstruct.checkoutFunction.addEnvironment(
      "CHECKOUT_TOPIC_ARN",
      checkoutTopic.topicArn,
    );

    // 3) Give webFunction permission to publish to the Topic
    lambdaConstruct.checkoutFunction.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["sns:Publish"],
        resources: [checkoutTopic.topicArn],
      }),
    );

    /// ///////////////////////////////////////////////////////////////////////
    ///
    ///  MODEL PROCESSOR HOOK-UP
    ///  processors listen for data hitting the API, then do something with
    ///  it
    /// ///////////////////////////////////////////////////////////////////////

    // 1) Create the TMX version of the processor
    const processorTMX = new ProcessorModel(this, "checkout-tmx", {
      stackName,
      environment,
      modelName: "checkout-tmx",
      stage,
      projectName: id,
      handlerPath: "src-lambda/handlers/processors/checkout-tmx.ts",
      inputTopic: checkoutTopic,
    });

    const processorOAK = new ProcessorModel(this, "checkout-oak", {
      stackName,
      environment,
      modelName: "checkout-oak",
      stage,
      projectName: id,
      handlerPath: "src-lambda/handlers/processors/checkout-oak.ts",
      inputTopic: checkoutTopic,
      bucket: processorTMX.bucket,
    });

    // 2) AthenaConstruct
    // Create a new bucket to store Athena query results.
    const queryResultsBucket = new s3.Bucket(this, "AthenaResultsBucket", {
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Adjust as needed (e.g., RETAIN in prod)
      autoDeleteObjects: true, // Useful for dev/test environments
    });

    // Instantiate our AthenaDBConstruct.
    // This creates a Glue database, two Glue tables for our JSON data, and an Athena workgroup.
    new AthenaConstruct(this, "AthenaDB", {
      stage,
      databaseName: `${stage}_oak_athena_db`,
      queryResultsBucket: queryResultsBucket,
      queryResultsPrefix: "athena-results",
      tables: [
        {
          tableName: "tmx_results",
          bucket: processorTMX.bucket,
          s3Prefix: "demo/tmx/", // Optional folder path within the bucket
          columns: TMX_TABLE_COLUMNS,
        },
        {
          tableName: "oak_results",
          bucket: processorOAK.bucket,
          s3Prefix: "demo/oak/", // Optional folder path within the bucket
          columns: OAK_TABLE_COLUMNS,
        },
      ],
    });
  }
}
