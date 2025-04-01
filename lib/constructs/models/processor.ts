import { ModelConstruct } from "../model-processor";
import { Construct } from "constructs";
import * as sns from "aws-cdk-lib/aws-sns";
import * as s3 from "aws-cdk-lib/aws-s3"; // Add this import

interface ModelConstructProps {
  stackName: string;
  environment: string;
  inputTopic: sns.ITopic;
  modelName: string;
  handlerPath: string;
  stage: string;
  projectName: string;
  bucket: s3.Bucket;
}

export class ProcessorModel extends ModelConstruct {
  public readonly bucket: s3.Bucket; // Make it accessible to other constructs if needed

  constructor(scope: Construct, id: string, props: ModelConstructProps) {
    super(scope, id, props);

    this.bucket = props.bucket;

    // Grant the Lambda function access to the bucket if needed
    this.bucket.grantReadWrite(this.processorFunction);

    // Make this more explicit:
    const BUCKET_NAME = this.bucket.bucketName;

    // Tell the processor function what bucket its going to hit...
    this.processorFunction.addEnvironment("BUCKET_NAME", BUCKET_NAME);
  }
}
