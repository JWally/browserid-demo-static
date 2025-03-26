import { EcMakeSigKeys, EcMakeCryptKeys } from "@justinwwolcott/ez-web-crypto";
import {
  SecretsManagerClient,
  GetSecretValueCommand,
  PutSecretValueCommand,
  GetSecretValueCommandOutput,
  PutSecretValueCommandOutput,
} from "@aws-sdk/client-secrets-manager";
import { Logger } from "@aws-lambda-powertools/logger";

/**
 * Interface describing the shape of the secret in Secrets Manager.
 */
interface SecretData {
  ENCRYPTION_PUBLIC_KEY?: string;
  ENCRYPTION_PRIVATE_KEY?: string;
  SIGNATURE_PUBLIC_KEY?: string;
  SIGNATURE_PRIVATE_KEY?: string;
  // Use an index signature to preserve other fields, if any:
  [key: string]: unknown;
}

/**
 * Defines the shape of the Lambda event for type safety.
 * Adjust fields as appropriate for your use case.
 */
interface KeyRotationEvent {
  // Include known event fields if needed; using an index signature for unknowns.
  [key: string]: unknown;
}

// Create a Powertools logger instance
const logger = new Logger({ serviceName: "KeyRotationLambda" });

/**
 * Lambda handler to rotate cryptographic keys in AWS Secrets Manager.
 *
 * 1) Fetches an existing secret from Secrets Manager (if it exists).
 * 2) Preserves existing signature keys or generates new ones if missing.
 * 3) Always generates new encryption (crypto) keys.
 * 4) Writes the updated secret back to Secrets Manager.
 *
 * @param event - The AWS Lambda event triggering this function.
 */
export const handler = async (event: KeyRotationEvent = {}): Promise<void> => {
  // Retrieve environment variables
  const REGION: string = process.env.AWS_REGION || "us-east-1";
  const SECRET_ARN: string | undefined = process.env.SECRET_ARN;

  logger.info("Starting key rotation...", { event });

  if (!SECRET_ARN) {
    const message = "SECRET_ARN environment variable is not set.";
    logger.error(message);
    throw new Error(message);
  }

  // Initialize the Secrets Manager client
  const client = new SecretsManagerClient({ region: REGION });

  // 1) Fetch existing secret from Secrets Manager
  let existingSecretData: SecretData = {};
  try {
    const getSecretResponse: GetSecretValueCommandOutput = await client.send(
      new GetSecretValueCommand({ SecretId: SECRET_ARN }),
    );

    if (getSecretResponse.SecretString) {
      existingSecretData = JSON.parse(
        getSecretResponse.SecretString,
      ) as SecretData;
      logger.debug("Fetched existing secret", { existingSecretData });
    } else {
      logger.debug("No existing SecretString found in Secrets Manager");
    }
  } catch (error) {
    logger.error("Error fetching existing secret", { error });
    throw error; // Re-throw to propagate error
  }

  // 2) Generate new encryption (crypto) keys (always)
  let encryptionKeys;
  try {
    encryptionKeys = await EcMakeCryptKeys(true);
  } catch (error) {
    logger.error("Error generating encryption keys", { error });
    throw error;
  }

  // 3) Preserve signature keys if they exist; otherwise generate new
  let { SIGNATURE_PUBLIC_KEY, SIGNATURE_PRIVATE_KEY } = existingSecretData;

  if (!SIGNATURE_PUBLIC_KEY || !SIGNATURE_PRIVATE_KEY) {
    logger.info("Generating new signature keys...");
    try {
      const newSigKeys = await EcMakeSigKeys(true);
      SIGNATURE_PUBLIC_KEY = newSigKeys.publicKey;
      SIGNATURE_PRIVATE_KEY = newSigKeys.privateKey as string;
    } catch (error) {
      logger.error("Error generating signature keys", { error });
      throw error;
    }
  } else {
    logger.info("Preserving existing signature keys.");
  }

  // 4) Build the new secret data structure
  const newSecretData: SecretData = {
    ...existingSecretData, // preserve extra fields if any
    ENCRYPTION_PUBLIC_KEY: encryptionKeys.publicKey,
    ENCRYPTION_PRIVATE_KEY: encryptionKeys.privateKey as string,
    SIGNATURE_PUBLIC_KEY,
    SIGNATURE_PRIVATE_KEY,
  };

  // 5) Save the updated secret back to AWS Secrets Manager
  try {
    const putSecretResponse: PutSecretValueCommandOutput = await client.send(
      new PutSecretValueCommand({
        SecretId: SECRET_ARN,
        SecretString: JSON.stringify(newSecretData),
      }),
    );
    logger.info("Secret updated successfully", {
      VersionId: putSecretResponse.VersionId,
    });
  } catch (error) {
    logger.error("Error updating secret in Secrets Manager", { error });
    throw error;
  }

  logger.info("Key rotation complete.");
};
