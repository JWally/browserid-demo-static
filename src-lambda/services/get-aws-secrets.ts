import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";
import {
  AWS_SECRETS_REQUIRED_KEYS,
  KEY_CACHE_DURATION,
  SECRET_KEY_ARN,
  ERROR_STRINGS,
} from "../helpers/constants";

let client: SecretsManagerClient | null = null;
let cachedSecrets: Record<string, string> | null = null;
let cacheTimestamp = 0;

/**
 * Retrieves secrets from AWS Secrets Manager with caching.
 *
 * The function fetches the secret, caches it, and refreshes it after the cache duration.
 *
 * @returns {Promise<Record<string, string>>} An object with the required keys.
 */
export const getAwsSecrets = async (): Promise<Record<string, string>> => {
  if (!SECRET_KEY_ARN) {
    throw new Error(ERROR_STRINGS.KEY_ARN_NOT_SET);
  }

  // Initialize client if not already done
  if (!client) {
    client = new SecretsManagerClient({});
  }

  // Check if the cache is still valid
  const isCacheValid =
    cachedSecrets && Date.now() - cacheTimestamp < KEY_CACHE_DURATION;

  if (isCacheValid) {
    // F*** YEA!!!
    return cachedSecrets!;
  }

  try {
    // Fetch secret from AWS Secrets Manager
    const command = new GetSecretValueCommand({ SecretId: SECRET_KEY_ARN });
    const data = await client.send(command);

    // Parse the secret JSON string
    const secret = JSON.parse(data.SecretString!) as Record<string, string>;

    const missingKeys = AWS_SECRETS_REQUIRED_KEYS.filter((key) => !secret[key]);
    if (missingKeys.length > 0) {
      throw new Error(`Missing required keys: ${missingKeys.join(", ")}`);
    }

    // Extract the required keys
    const {
      OAK_API_KEY,
      TMX_API_KEY,
    } = secret;

    // Cache the result
    cachedSecrets = {
      OAK_API_KEY,
      TMX_API_KEY,
    };

    cacheTimestamp = Date.now();

    return cachedSecrets;
  } catch (error) {
    console.error("Error retrieving secret:", error);
    throw new Error(ERROR_STRINGS.SECRETS_MANAGER_FAILED);
  }
};

/**
 * Clears the cached secrets and forces a refresh on the next request.
 */
export const clearCache = (): void => {
  cachedSecrets = null;
  cacheTimestamp = 0;
};
