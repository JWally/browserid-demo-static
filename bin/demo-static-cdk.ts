#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { DemoStaticCdkStack } from '../lib/demo-static-cdk-stack';

const app = new cdk.App();
new DemoStaticCdkStack(app, 'DemoStaticCdkStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
