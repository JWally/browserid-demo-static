import { ModelConstruct } from '../model-processor';
import { Construct } from 'constructs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as s3 from 'aws-cdk-lib/aws-s3'; // Add this import
import { Duration } from 'aws-cdk-lib';

interface ModelConstructProps {
  stackName: string;
  environment: string;
  inputTopic: sns.ITopic;
  modelName: string;
  handlerPath: string;
  stage: string;
  projectName: string;
}

export class ModelCheckoutTmx extends ModelConstruct {
  public readonly bucket: s3.Bucket; // Make it accessible to other constructs if needed

  constructor(scope: Construct, id: string, props: ModelConstructProps) {
    super(scope, id, props);

    // Create the bucket
    this.bucket = new s3.Bucket(this, `${props.stackName}-${props.modelName}`, {
      // Set lifecycle rule for TTL
      lifecycleRules: [
        {
          expiration: Duration.days(30), // Objects expire after 30 days
        },
      ],

      // Make it public - Note: AWS generally recommends against this
      // Only do this if you really need public access
      publicReadAccess: true,
      blockPublicAccess: new s3.BlockPublicAccess({
        blockPublicAcls: false,
        blockPublicPolicy: false,
        ignorePublicAcls: false,
        restrictPublicBuckets: false,
      }),

      // Optional: Add versioning if needed
      versioned: true,

      // Optional: Add encryption
      encryption: s3.BucketEncryption.S3_MANAGED,

      // Optional: Add bucket name
      bucketName: `${props.stackName}-checkout-bucket`,
    });

    // Grant the Lambda function access to the bucket if needed
    this.bucket.grantReadWrite(this.processorFunction);

    // Tell the processor function what bucket its going to hit...
    this.processorFunction.addEnvironment('BUCKET_NAME', this.bucket.bucketName);
  }
}
