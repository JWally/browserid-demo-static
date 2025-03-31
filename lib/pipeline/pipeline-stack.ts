import { Stack, StackProps, SecretValue } from "aws-cdk-lib";
import { Construct } from "constructs";
import {
  CodePipeline,
  CodePipelineSource,
  CodeBuildStep,
  ManualApprovalStep,
} from "aws-cdk-lib/pipelines";
import * as codebuild from "aws-cdk-lib/aws-codebuild";
import { PolicyStatement } from "aws-cdk-lib/aws-iam";
import { AppStage } from "./pipeline-stages";
import { PIPELINE } from "./constants";

export interface PipelineStackProps extends StackProps {
  rootDomain: string;
  repo: string;
  secretsManager: string;
  siteDomains: string[];
}

export class PipelineStack extends Stack {
  constructor(scope: Construct, id: string, props: PipelineStackProps) {
    super(scope, id, props);

    const { repo, secretsManager, rootDomain, siteDomains } = props;

    // Define GitHub source using props
    const source = CodePipelineSource.gitHub(repo, "main", {
      authentication: SecretValue.secretsManager(secretsManager, {
        jsonField: "key",
      }),
    });

    // Rest of your pipeline code remains unchanged...
    const pipeline = new CodePipeline(this, id, {
      crossAccountKeys: true,
      synth: new CodeBuildStep("Synth", {
        input: source,
        buildEnvironment: {
          buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
          environmentVariables: {
            NODE_VERSION: { value: "20" },
          },
        },
        commands: [
          "n $NODE_VERSION",
          "npm ci",
          "npm run site:build",
          "npm run lint:fix",
          "npm run test",
          "npx cdk synth",
        ],
        rolePolicyStatements: [
          new PolicyStatement({
            actions: ["route53:ListHostedZonesByName"],
            resources: ["*"],
          }),
        ],
      }),
    });

    PIPELINE.forEach((PIPE_STAGE, ndx) => {
      if (PIPE_STAGE.regions.length === 1) {
        const stage = new AppStage(
          this,
          PIPE_STAGE.name,
          rootDomain,
          {
            env: {
              account: props.env?.account,
              region: PIPE_STAGE.regions[0],
            },
          },
          siteDomains,
        );
        const deploy = pipeline.addStage(stage);

        if (ndx < PIPELINE.length - 1)
          deploy.addPost(
            new ManualApprovalStep(`PromoteFrom${PIPE_STAGE.name}`),
          );
      } else {
        const wave = pipeline.addWave(`${PIPE_STAGE.name}Wave`);
        PIPE_STAGE.regions.forEach((region) => {
          wave.addStage(
            new AppStage(
              this,
              `${PIPE_STAGE.name}-${region}`,
              rootDomain,
              {
                env: {
                  account: props.env?.account,
                  region,
                },
              },
              siteDomains,
            ),
          );
        });

        if (ndx < PIPELINE.length - 1)
          wave.addPost(new ManualApprovalStep(`PromoteFrom${PIPE_STAGE.name}`));
      }
    });
  }
}
