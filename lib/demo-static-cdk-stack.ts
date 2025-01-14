// bid-static-cdk-stack.ts
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as certificatemanager from 'aws-cdk-lib/aws-certificatemanager';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import { S3Bucket } from './s3-bucket';
import { Route53 } from './route53';
import { DOMAINS, CERTIFICATE_REGION } from './constants';

export class DemoStaticCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // S3 bucket
    const s3Bucket = new S3Bucket(this);

    // Route53 hosted zones
    const route53 = new Route53(this, DOMAINS);

    // Generate full domain names for certificate
    const domainNames = DOMAINS.map(d => `${d.subdomain}.${d.domain}`);

    // Certificate with all domain names
    // In demo-static-cdk-stack.ts

    // Change the certificate creation to:
    const certificate = new certificatemanager.Certificate(this, 'SigFingerPrintDemoCertificate', {
      domainName: domainNames[0],
      subjectAlternativeNames: domainNames.slice(1),
      validation: certificatemanager.CertificateValidation.fromDnsMultiZone(
        // Create a map of domain to hosted zone
        Object.fromEntries(
          DOMAINS.map(d => [
            `${d.subdomain}.${d.domain}`,
            route53.hostedZones.get(d.domain)!
          ])
        )
      )
    });

    // CloudFront distribution
    const cloudfrontDistribution = new cloudfront.Distribution(this, 'SigFingerPrintDemoSite-cloud', {
      defaultBehavior: {
        origin: new origins.S3Origin(s3Bucket.bucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        compress: true,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
      httpVersion: cloudfront.HttpVersion.HTTP2_AND_3,
      enableLogging: true,
      defaultRootObject: "index.html",
      domainNames: domainNames,
      certificate: certificate,
      minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
    });

    // Route53 alias records for all domains
    route53.createAliasRecords(this, new targets.CloudFrontTarget(cloudfrontDistribution), DOMAINS);

    // Deploy site content to S3 bucket
    new s3deploy.BucketDeployment(this, 'SigFingerPrintDemoSite-bucket', {
      sources: [s3deploy.Source.asset('./dist')],
      destinationBucket: s3Bucket.bucket,
      distribution: cloudfrontDistribution,
      distributionPaths: ['/*'],
      metadata: { 'Content-Encoding': 'br' },
    });

    new cdk.CfnOutput(this, 'SigFingerPrintDemoSite-cdk', {
      value: cloudfrontDistribution.distributionDomainName,
    });
  }
}