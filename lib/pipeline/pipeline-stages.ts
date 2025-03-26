// file: pipeline-stacks.ts
import { Stage, StageProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { TheStack } from "../stacks/app-stack";

export class MirvAppStage extends Stage {
  constructor(
    scope: Construct,
    id: string,
    rootDomain: string,
    props?: StageProps,
  ) {
    super(scope, id, props);
    new TheStack(this, "ms-oak-demo", {
      // You might pass the environment from stage-level or override it here
      env: props?.env,
      environment: id.toLowerCase(), // e.g. 'dev', 'qa', 'uat', 'prod'
      stackName: `ms-oak-demo-${id.toLowerCase()}-stack`,
      rootDomain: rootDomain,
      stage: id.toLowerCase().split("-")[0],
      region: props?.env?.region ?? "us-east-1",
      account: props?.env?.account ?? "XXXXXXX",
    });
  }
}
