export const TMX_ORG_ID: string = "w2txo5aa";
export const SIG_SCRIPT_DOMAIN: string = "imgs.signifyd.com";
export const SIG_TOOLKIT_URL: string =
  "https://cdn-scripts.signifyd.com/api/company_toolkit.js";

export const OAK_SCRIPT_URL: string =
  "https://lfsjbhurq8h4.s3.us-east-1.amazonaws.com/loader.js";

export const S3_ROOT_URL: string = "https://ms-oak-demo";

export const [DEMO_STAGE] = document.location.host.split(".");

export const STACK_STAGES: string[] = ["dev", "qa", "uat", "prod"];

export const DEMO_API_URL: string = `https://api-${DEMO_STAGE}.iron-bank.net/v1/checkout`;

// TODO: This is code stink - clean it up at the stack, not the site.
export const STACK_BUCKET_ARTIFACT: string = STACK_STAGES.includes(DEMO_STAGE)
  ? "stack-"
  : "";

export const TMX_BUCKET_URL: string = `${S3_ROOT_URL}-${DEMO_STAGE}-${STACK_BUCKET_ARTIFACT}checkout-bucket.s3.us-east-1.amazonaws.com/demo/tmx/`;
export const OAK_BUCKET_URL: string = `${S3_ROOT_URL}-${DEMO_STAGE}-${STACK_BUCKET_ARTIFACT}checkout-bucket.s3.us-east-1.amazonaws.com/demo/oak/`;
