// src/handlers/queue-processor.ts

import { ERROR_STRINGS } from "./constants";

/* ============================================================================
   TYPE DEFINITIONS
   ========================================================================== */
interface BrowserVerification {
  target: string;
  serverSignature: string;
  serverPublicKey: string;
}

export interface BrowserCryptoFingerprint {
  publicKey: string;
  verification: BrowserVerification;
}

export interface DecryptedData {
  browserCryptoFingerPrint: BrowserCryptoFingerprint;
  // Add any other fields expected from the decrypted payload here.
}

interface CustomHeaders {
  "Content-Type"?: string;
  Authorization?: string;
  // other known headers...
  [key: string]: unknown;
}

export interface MessageBody {
  body: string; // encrypted body as a JSON string
  headers: CustomHeaders;
  ipAddress: string;
}

interface SQSParsedMessage {
  Message: string; // inner JSON string containing MessageBody, etc.
}

/* ============================================================================
   HELPER FUNCTIONS
   ========================================================================== */

/**
 * Parses JSON from a string.
 * @throws {Error} if parsing fails.
 */
export const parseJSON = <T>(data: unknown): T => {
  if (typeof data !== "string") {
    return data as T;
  }
  try {
    return JSON.parse(data) as T;
  } catch (error) {
    console.error("JSON parsing error:", error);
    throw new Error(ERROR_STRINGS.CANNOT_PARSE_JSON);
  }
};

/* ============================================================================
   MAIN HANDLER FUNCTION
   ========================================================================== */

/**
 * Processes an SQS payload. This function:
 *   1. Parses the payload.
 *   2. Extracts and parses the embedded message.
 *
 * Returns the decrypted data along with any headers and IP address from the payload.
 *
 * @throws {Error} if any processing step fails.
 */
export const SQSBodyParser = async (
  payload: string,
): Promise<{ data: unknown; headers: CustomHeaders; ipAddress: string }> => {
  // Step 1: Parse the outer SQS payload.
  const parsedPayload = parseJSON<SQSParsedMessage>(payload);

  // Step 2: Parse the inner message body.
  const { body, headers, ipAddress } = parseJSON<MessageBody>(
    parsedPayload.Message,
  );

  return { data: body, headers, ipAddress };
};
