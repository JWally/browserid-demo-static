import { Construct } from "constructs";
import * as s3 from "aws-cdk-lib/aws-s3"; // Add this import
import { Duration } from "aws-cdk-lib";

interface S3DataBucketConstructorProps {
  stackName: string;
}

export class S3DataBucket extends Construct {
  public readonly bucket: s3.Bucket; // Make it accessible to other constructs if needed

  constructor(
    scope: Construct,
    id: string,
    props: S3DataBucketConstructorProps,
  ) {
    super(scope, id);

    // Create the bucket
    this.bucket = new s3.Bucket(this, `${props.stackName}-checkout-bucket`, {
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

      // Optional: Cors for rest:
      cors: [
        {
          allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.HEAD],
          allowedOrigins: ["*"], // or specify your domain(s)
          allowedHeaders: ["*"],
        },
      ],
    });
  }
}
