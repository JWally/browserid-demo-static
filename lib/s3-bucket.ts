import * as s3 from 'aws-cdk-lib/aws-s3';
import { RemovalPolicy } from 'aws-cdk-lib'; // Import RemovalPolicy
import { Construct } from 'constructs';

export class S3Bucket {
  public readonly bucket: s3.Bucket;

  constructor(scope: Construct) {
    this.bucket = new s3.Bucket(scope, 'SiteBucket', {
      versioned: true,
      removalPolicy: RemovalPolicy.DESTROY, // Use RemovalPolicy here
      autoDeleteObjects: true,
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'error.html',
      publicReadAccess: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ACLS, // Allow bucket-level public access
    });
  }
}
