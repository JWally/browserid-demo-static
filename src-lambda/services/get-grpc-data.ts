/**
 * gRPC Client for Device Profile Service
 *
 * This module establishes a connection to the Device Profile Service using gRPC,
 * providing methods to retrieve device profiles based on session IDs.
 */

import * as fs from "fs";
import * as os from "os";
import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import path from "path";
import { Logger } from "@aws-lambda-powertools/logger";
import { Metrics } from "@aws-lambda-powertools/metrics";

import { getAwsSecrets } from "./get-aws-secrets";
import { getServerPublicIp } from "./get-server-public-ip";

import {
  GRPC_PORT,
  OAK_PROTO_FILE,
  POWERTOOLS_SERVICE_NAME,
} from "../helpers/constants";

/**
 * Derive the correct client type from the constructor.
 * This includes methods like `getDeviceProfile`.
 */
type DeviceProfileServiceClient = InstanceType<
  typeof deviceProfile.DeviceProfileService
>;

// Service name for logging and metrics
const TOOL_NAME = `${POWERTOOLS_SERVICE_NAME}-checkout-processor`;

/**
 * Initialize AWS Lambda Powertools for logging and metrics
 * These utilities help with structured logging and metrics collection in AWS environments
 */
export const logger = new Logger({
  serviceName: TOOL_NAME,
});

export const metrics = new Metrics({
  namespace: POWERTOOLS_SERVICE_NAME,
  serviceName: TOOL_NAME,
});

/**
 * Write the proto definition to a temporary file for loading
 * This allows us to use a proto definition stored as a string constant
 */
const tmpDir = os.tmpdir();
const protoFilePath = path.join(tmpDir, "temp.proto");

if (!fs.existsSync(protoFilePath)) {
  fs.writeFileSync(protoFilePath, OAK_PROTO_FILE);
}

/**
 * Load and parse the protocol buffer definition
 * This creates a JavaScript object structure from the proto definition
 */
const packageDefinition = protoLoader.loadSync(protoFilePath, {
  keepCase: true, // Preserves field casing (snake_case)
  longs: String, // Represents 64-bit numbers as strings to preserve precision
  enums: String, // Represents enum values as strings
  defaults: true, // Includes default values
  oneofs: true, // Preserves oneof fields
});

// Generate service descriptors from the package definition
const protoDescriptor = grpc.loadPackageDefinition(
  packageDefinition,
) as unknown;

// If it's undefined (or not an object), gracefully throw an error
if (!protoDescriptor || typeof protoDescriptor !== "object") {
  throw new Error("Proto descriptor is invalid or undefined");
}
if (!("signifyd" in protoDescriptor)) {
  throw new Error("signifyd namespace not present in proto descriptor");
}

// Define a type for our expected proto structure to help TypeScript understand
interface SignifydProto {
  signifyd: {
    messages: {
      oak: {
        DeviceProfileService: grpc.ServiceClientConstructor;
      };
    };
  };
}

// Validate the proto structure and access the device profile service
// Using type assertion to help TypeScript understand the structure
if (!("signifyd" in protoDescriptor)) {
  throw new Error("signifyd namespace not present in proto descriptor");
}

const signifydProto = protoDescriptor as unknown as SignifydProto;

if (!("messages" in signifydProto.signifyd)) {
  throw new Error(
    "messages namespace not present in signifyd proto descriptor",
  );
}

if (!("oak" in signifydProto.signifyd.messages)) {
  throw new Error("oak namespace not present in messages proto descriptor");
}

const deviceProfile = signifydProto.signifyd.messages.oak;

/**
 * Create a gRPC client instance for the Device Profile Service
 * Using insecure credentials - consider using SSL in production
 */
// Ensure DeviceProfileService exists before creating client
if (!("DeviceProfileService" in deviceProfile)) {
  throw new Error("DeviceProfileService not found in oak proto descriptor");
}

/**
 * Cache our client so we're not constantly creating it...
 */

// Then declare your client with that type:
let GRPC_CLIENT: DeviceProfileServiceClient;

/**
 * Retrieve device profile data for a given session ID
 *
 * @param {string} sessionId - The session identifier to look up
 * @returns {Promise<unknown>} A promise that resolves to the device profile data
 * @throws Will reject the promise if the gRPC call fails
 */
export const getGrpcData = async (
  sessionId: string,
): Promise<Record<string, unknown>> => {
  // Prepare authentication metadata for the request
  const metadata = new grpc.Metadata();

  // pull api key for oak, store in
  const API_KEYS = await getAwsSecrets();
  const OAK_API_KEY = API_KEYS.OAK_API_KEY;

  /**
   * Determine the gRPC endpoint based on the current environment
   * @returns {string} The gRPC endpoint address in host:port format
   */
  const GRPC_HOST_IP = await getServerPublicIp();
  const getGrpcEndpoint = (): string => {
    // Using hardcoded IP and port - consider making this configurable via env vars
    const host = GRPC_HOST_IP;
    const port = GRPC_PORT;
    return `${host}:${port}`;
  };

  if (!GRPC_CLIENT) {
    GRPC_CLIENT = new deviceProfile.DeviceProfileService(
      getGrpcEndpoint(),
      grpc.credentials.createInsecure(),
    );
  }

  metadata.add("authorization", `Bearer ${OAK_API_KEY}`);

  // Wrap the gRPC call in a promise to enable async/await usage
  return new Promise((resolve, reject) => {
    GRPC_CLIENT.getDeviceProfile(
      { session_id: sessionId },
      metadata,
      (error: unknown, response: Record<string, unknown>) => {
        if (error) {
          logger.error("Failed to get device profile", { error, sessionId });
          reject(error);
        } else {
          logger.info("Successfully retrieved device profile", { sessionId });
          resolve(response);
        }
      },
    );
  });
};
