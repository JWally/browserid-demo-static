// bin/mirv.ts
import { App } from "aws-cdk-lib";
import { PipelineStack } from "../lib/pipeline/pipeline-stack";
import { TheStack as AppStack } from "../lib/stacks/app-stack";
import {
  ROOT_DOMAIN,
  SITE_DOMAINS,
  PIPELINE_NAME,
  PIPELINE_GIT_REPO,
  PIPELINE_GIT_SECRET_MANAGER,
  AWS_ACCOUNT_ID,
  PIPELINE_HOME_REGION,
} from "./config";

const app = new App();

// Pipeline
new PipelineStack(app, PIPELINE_NAME, {
  rootDomain: ROOT_DOMAIN,
  repo: PIPELINE_GIT_REPO,
  secretsManager: PIPELINE_GIT_SECRET_MANAGER,
  siteDomains: SITE_DOMAINS,
  env: {
    account: AWS_ACCOUNT_ID,
    region: PIPELINE_HOME_REGION,
  },
});

// /////////////////////////////////
// Personal stacks
// : add your details
// : and run `cdk bootstrap ms-oak-demo-dev-XX (just do 1x / region)
// : next do `cdk deploy ms-oak-demo-dev-XX`
// /////////////////////////////////
new AppStack(app, "ms-oak-demo-dev-jw", {
  // the custom props that your TheStack constructor requires
  env: { account: "263318538229", region: "us-east-1" },
  environment: "dev-jw",
  stackName: "ms-oak-demo-dev-jw",
  rootDomain: ROOT_DOMAIN,
  stage: "dev-jw",
  region: "us-east-1",
  account: "263318538229",
  siteDomains: SITE_DOMAINS,
});

app.synth();
