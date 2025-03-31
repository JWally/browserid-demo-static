import { getAwsSecrets } from "./get-aws-secrets";
import { Logger } from "@aws-lambda-powertools/logger";
import { Metrics } from "@aws-lambda-powertools/metrics";
import { URL } from "url";
import { POWERTOOLS_SERVICE_NAME } from "../helpers/constants";

// Powertools configuration
const TOOL_NAME = `${POWERTOOLS_SERVICE_NAME}-get-tmx-data`;

// Initialize Powertools logger and metrics
export const logger = new Logger({ serviceName: TOOL_NAME });
export const metrics = new Metrics({
  namespace: POWERTOOLS_SERVICE_NAME,
  serviceName: TOOL_NAME,
});

/**
 * Retrieves ThreatMetrix session data using session ID.
 *
 * @param {string} sessionId - The session identifier.
 * @returns {Promise<object>} - Resolves to the session data from ThreatMetrix API.
 */
export const getTmxData = async (sessionId: string): Promise<object> => {
  // Retrieve API credentials securely from AWS Secrets Manager
  const { TMX_API_KEY, TMX_ORG_ID } = await getAwsSecrets();

  // Build ThreatMetrix API URL with proper URL construction
  const tmxUrl = new URL("https://h-api.online-metrix.net/api/session-query");
  tmxUrl.searchParams.set("org_id", TMX_ORG_ID);
  tmxUrl.searchParams.set("api_key", TMX_API_KEY);
  tmxUrl.searchParams.set("session_id", sessionId);
  tmxUrl.searchParams.set("service_type", "session-policy");
  tmxUrl.searchParams.set("output_format", "json");

  logger.info("Fetching ThreatMetrix data", { sessionId });

  // Fetch and parse the ThreatMetrix API response
  const response = await fetch(tmxUrl.toString());

  if (!response.ok) {
    const errorMessage = `Failed to fetch ThreatMetrix data: ${response.status} ${response.statusText}`;
    logger.error(errorMessage, { status: response.status });
    throw new Error(errorMessage);
  }

  const responseData = await response.json();

  logger.info("ThreatMetrix data retrieved successfully", { sessionId });

  return responseData;
};
