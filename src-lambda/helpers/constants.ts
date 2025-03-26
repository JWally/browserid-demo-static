import { Options } from "@middy/http-cors";

export const SECURITY_KEY_NAME = "oak-demo-api-keys";

// Cache duration: 15 minutes (configurable)
export const KEY_CACHE_DURATION: number = 1000 * 60 * 15;

export const DEFAULT_HEADERS = {
  "Content-Security-Policy": "default-src 'self'",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "X-Content-Type-Options": "nosniff",
  "X-Download-Options": "noopen",
  "X-Frame-Options": "DENY",
  "X-Permitted-Cross-Domain-Policies": "none",
  "Referrer-Policy": "no-referrer",
  "X-XSS-Protection": "1; mode=block",
} as const;

// List of allowed headers for CORS
export const ALLOWED_HEADERS = [
  "Content-Type",
  "X-Amz-Date",
  "Authorization",
  "X-Api-Key",
  "X-Amz-Security-Token",
  "X-Amz-User-Agent",
  "Accept",
  "Accept-Language",
  "Content-Language",
  "Origin",
  "X-Requested-With",
];

const HARDENED_ORIGIN = "*";

// CORS configuration
export const MIDDY_CORS_CONFIG: Options = {
  origin: HARDENED_ORIGIN,
  credentials: true,
  methods: ["POST", "OPTIONS"].join(","),
  headers: ALLOWED_HEADERS.join(","),
};

export const WARMUP_EVENT = {
  source: "serverless-plugin-warmup",
  event: {
    source: "warmup",
    type: "keepalive",
  },
};

export const AWS_SECRETS_REQUIRED_KEYS: string[] = [
  "TMX_API_KEY",
  "TMX_ORG_ID",
  "OAK_API_KEY",
];

export const ERROR_STRINGS = {
  SECRETS_MANAGER_FAILED: "Failed to retrieve secrets from Secrets Manager",
  KEY_ARN_NOT_SET: "Environment variables SECRET_KEY_ARN must be set",
  CANNOT_PARSE_JSON: "Cannot Parse JSON Data",
  CANNOT_DECRYPT: "Cannot Decrypt Payload",
  CANNOT_VERIFY_SIGNATURE: "Cannot Verify Signature",
};

export const SECRET_KEY_ARN: string | undefined = process.env.SECRET_KEY_ARN;
export const POWERTOOLS_METRICS_NAMESPACE: string | undefined =
  process.env.POWERTOOLS_METRICS_NAMESPACE;
export const POWERTOOLS_SERVICE_NAME: string | undefined =
  process.env.POWERTOOLS_SERVICE_NAME;
