export const TMX_ORG_ID: string = "w2txo5aa";
export const SIG_SCRIPT_DOMAIN: string = "imgs.signifyd.com";
export const SIG_TOOLKIT_URL: string =
  "https://cdn-scripts.signifyd.com/api/company_toolkit.js";

export const S3_ROOT_URL: string = "https://ms-oak-demo";
export const [DEMO_STAGE] = document.location.host.split(".");

export const TMX_BUCKET_URL: string = `${S3_ROOT_URL}-${DEMO_STAGE}-checkout-bucket.s3.us-east-1.amazonaws.com/demo/tmx/`;

export const DEMO_API_URL: string = `https://${DEMO_STAGE}.browserid.info/v1/checkout`;
