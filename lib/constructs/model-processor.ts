import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda-nodejs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as subs from 'aws-cdk-lib/aws-sns-subscriptions';
import * as eventSources from 'aws-cdk-lib/aws-lambda-event-sources';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as path from 'path';
import { Runtime, Tracing } from 'aws-cdk-lib/aws-lambda';
import { OutputFormat } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Duration } from 'aws-cdk-lib';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { SECURITY_KEY_NAME } from '../helpers/constants';

interface ModelConstructProps {
  stackName: string;
  environment: string;
  inputTopic: sns.ITopic;
  modelName: string;
  handlerPath: string;
  stage: string;
  projectName: string;
}

export class ModelConstruct extends Construct {
  public readonly processorFunction: lambda.NodejsFunction;

  constructor(scope: Construct, id: string, props: ModelConstructProps) {
    super(scope, id);

    const { stackName, environment, inputTopic, modelName, handlerPath, stage, projectName } =
      props;

    // Get secret from Secrets Manager
    const secret = secretsmanager.Secret.fromSecretNameV2(
      this,
      SECURITY_KEY_NAME,
      SECURITY_KEY_NAME,
    );

    // 1. Create Dead Letter Queue
    const dlq = new sqs.Queue(this, `${modelName}-dlq`, {
      queueName: `${stackName}-${modelName}-dlq`,
      retentionPeriod: Duration.days(2), // Keep failed messages for 2 days
    });

    // 2. Create main SQS Queue with DLQ
    const queue = new sqs.Queue(this, `${modelName}-queue`, {
      queueName: `${stackName}-${modelName}-queue`,
      deadLetterQueue: {
        queue: dlq,
        maxReceiveCount: 3, // Messages go to DLQ after 3 failed receives
      },
    });

    // 3. Subscribe the Queue to the input SNS Topic
    inputTopic.addSubscription(new subs.SqsSubscription(queue));

    // 4. Create Processor Lambda
    this.processorFunction = new lambda.NodejsFunction(
      this,
      `${stackName}-${modelName}-processor`,
      {
        runtime: Runtime.NODEJS_20_X,
        memorySize: 2048,
        bundling: {
          minify: true,
          sourceMap: true,
          target: 'node20',
          keepNames: true,
          format: OutputFormat.CJS,
          mainFields: ['module', 'main'],
          environment: { NODE_ENV: 'production' },
        },
        environment: {
          AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
          ENVIRONMENT: environment,
          POWERTOOLS_SERVICE_NAME: `${stackName}-${modelName}`,
          POWERTOOLS_METRICS_NAMESPACE: stackName,
          LOG_LEVEL: 'INFO',
          SECRET_KEY_ARN: secret.secretArn,
        },
        tracing: Tracing.ACTIVE,
        entry: path.join(handlerPath),
        functionName: `${stackName}-${modelName}-processor`,
      },
    );

    // 5. Connect Lambda to SQS Queue
    this.processorFunction.addEventSource(
      new eventSources.SqsEventSource(queue, {
        batchSize: 10,
        maxConcurrency: 10,
      }),
    );

    // 6. Grant necessary permissions
    queue.grantConsumeMessages(this.processorFunction);

    // Add CloudWatch logging permissions
    this.processorFunction.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['logs:CreateLogGroup', 'logs:CreateLogStream', 'logs:PutLogEvents'],
        resources: ['*'],
      }),
    );

    // 7. Grant Necessary Permissions

    const IAM_LOGGING_POLICY = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['logs:CreateLogGroup', 'logs:CreateLogStream', 'logs:PutLogEvents'],
      resources: ['*'],
    });

    // Add IAM Logging Policy to Lambdas as necessary
    this.processorFunction.addToRolePolicy(IAM_LOGGING_POLICY);

    // Add the policy to both functions
    secret.grantRead(this.processorFunction);

  }
}
