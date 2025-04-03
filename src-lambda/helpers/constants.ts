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

export const OAK_PROTO_FILE: string = `
syntax = "proto3";

package signifyd.messages.oak;

option go_package = "./device_profile";

option java_multiple_files = true;
option java_package = "com.signifyd.grpc.messages.oak";

import "google/protobuf/timestamp.proto";
import "google/protobuf/wrappers.proto";

service DeviceProfileService {
    rpc GetDeviceProfile (DeviceProfileRequest) returns (DeviceProfileResponse);
}

message DeviceProfileRequest {
    string session_id = 1;
}

message Headers {
    google.protobuf.StringValue ip_address = 1;
    google.protobuf.StringValue user_agent = 2;
    google.protobuf.StringValue origin = 3;
}

enum BatteryStatus {
    BATTERY_STATUS_UNSPECIFIED = 0;
    BATTERY_STATUS_CHARGING = 1;
    BATTERY_STATUS_DISCHARGING = 2;
}

message BatteryStatusValue {
    BatteryStatus value = 1;
}

message Battery {
    google.protobuf.FloatValue level = 1;
    BatteryStatusValue status = 2;
}

message IpAddress {
    google.protobuf.StringValue dns_ip = 1;
    google.protobuf.StringValue true_ip = 2;
}

enum ClientType {
    CLIENT_TYPE_UNSPECIFIED = 0;
    CLIENT_TYPE_WEB_BROWSER = 1;
    CLIENT_TYPE_NATIVE_APP = 2;
}

message ClientTypeValue {
    ClientType value = 1;
}

enum DeviceType {
    DEVICE_TYPE_UNSPECIFIED = 0;
    DEVICE_TYPE_DESKTOP = 1;
    DEVICE_TYPE_MOBILE = 2;
}

message DeviceTypeValue {
    DeviceType value = 1;
}

enum EventType {
    EVENT_TYPE_UNSPECIFIED = 0;
    EVENT_TYPE_PURCHASE = 1;
}

message EventTypeValue {
    EventType value = 1;
}

message Timezone {
    google.protobuf.StringValue zone = 1;
    google.protobuf.StringValue location = 2;
    google.protobuf.StringValue location_measured = 3;
    google.protobuf.Int32Value offset = 4;
    google.protobuf.Int32Value offset_computed = 5;
    google.protobuf.Int32Value location_epoch = 6;
}

enum Orientation {
    ORIENTATION_UNSPECIFIED = 0;
    ORIENTATION_PORTRAIT = 1;
    ORIENTATION_LANDSCAPE = 2;
    ORIENTATION_OTHER = 3;
}

message OrientationValue {
    Orientation value = 1;
}

message StringList {
    repeated google.protobuf.StringValue values = 1;
}

message Anomalies {
    map<string, StringList> anomalies = 1;
}

message NavigationRecord {
    google.protobuf.StringValue url = 1;
    google.protobuf.StringValue ip = 2;
    google.protobuf.StringValue user_agent = 3;
}

message NavigationEntry {
    google.protobuf.Timestamp timestamp = 1;
    NavigationRecord record = 2;
}

message NavigationHistory {
    repeated NavigationEntry page_views = 1;
}

enum PrivateBrowsingMode {
    PRIVATE_BROWSING_MODE_UNSPECIFIED = 0;
    PRIVATE_BROWSING_MODE_ENABLED = 1;
    PRIVATE_BROWSING_MODE_DISABLED = 2;
    PRIVATE_BROWSING_MODE_NOT_APPLICABLE = 3;
}

message PrivateBrowsingModeValue {
    PrivateBrowsingMode value = 1;
}

message ProfileData {
    google.protobuf.StringValue session_id = 1;
    google.protobuf.StringValue device_id = 2;
    ClientTypeValue client_type = 3;
    google.protobuf.StringValue crypto_browser_id = 4;
    DeviceTypeValue device_type = 5;
    google.protobuf.BoolValue flash_enabled = 6;
    google.protobuf.StringValue fuzzy_browser_id = 7;
    google.protobuf.StringValue navigator_os = 8;
    google.protobuf.StringValue os_version = 9;
    google.protobuf.Timestamp session_last_profiled = 10;
    google.protobuf.Timestamp profile_time = 11;
    google.protobuf.StringValue user_agent = 12;
    google.protobuf.StringValue user_agent_os = 13;
    Headers headers = 14;
    Battery battery = 15;
    IpAddress ip_address = 16;
    EventTypeValue event_type = 17;
    google.protobuf.StringValue browser_language = 18;
    Timezone timezone_data = 20;
    OrientationValue orientation = 21;
    google.protobuf.Int32Value lie_count = 22;
    google.protobuf.Int32Value time_since_profile = 23;
    google.protobuf.BoolValue cookies_enabled = 24;
    google.protobuf.StringValue api_version = 25;
    Anomalies anomalies = 26;
    NavigationHistory navigation_history = 27;
    PrivateBrowsingModeValue private_browsing_mode = 28;
    google.protobuf.StringValue browser_name = 29;
}

message DeviceProfileResponse {
    ProfileData profile_data = 1;
}
`;

export const GRPC_PORT: string = "50051";
export const GRPC_SERVER_INSTANCE_ID: string = "i-000ed52de0c80c202";
