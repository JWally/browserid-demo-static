// bin/mirv.ts
import { App } from "aws-cdk-lib";
import { PipelineStack } from "../lib/pipeline/pipeline-stack";
import { TheStack as AppStack } from "../lib/stacks/app-stack";

const app = new App();
const ROOT_DOMAIN: string = "browserid.info";

// Pipeline
new PipelineStack(app, "ms-oak-demo", {
  rootDomain: ROOT_DOMAIN,
  repo: "JWally/ms-oak-fe-api",
  secretsManager: "github-token/ms-oak-demo",
  env: {
    account: "263318538229",
    region: "us-east-1",
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
});

app.synth();
