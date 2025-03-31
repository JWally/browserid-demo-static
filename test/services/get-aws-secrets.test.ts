import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mockClient } from "aws-sdk-client-mock";
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";

// ──────────────────────────────────────
// MOCK THE CONSTANTS FOR MOST TESTS
// ──────────────────────────────────────
// Here we stub the constants module so that our module under test (getAwsSecrets)
// will use these stubbed values.
// (Note: The SECRET_KEY_ARN is set to a valid ARN string here.)
vi.mock("../../src-lambda/helpers/constants", () => {
  return {
    AWS_SECRETS_REQUIRED_KEYS: ["TMX_API_KEY", "OAK_API_KEY"],
    KEY_CACHE_DURATION: 1000 * 60 * 60, // 1 hour in ms
    SECRET_KEY_ARN: "valid-secret-arn",
    ERROR_STRINGS: {
      KEY_ARN_NOT_SET: "Key ARN not set",
      SECRETS_MANAGER_FAILED: "Secrets Manager call failed",
    },
  };
});

// Now import the module under test normally (using the above constants)
import {
  getAwsSecrets,
  clearCache,
} from "../../src-lambda/services/get-aws-secrets";

// Create a mock for the AWS SecretsManagerClient
const secretsManagerMock = mockClient(SecretsManagerClient);

// Mock valid secret data
const mockValidData = {
  OAK_API_KEY: "abc-1234",
  TMX_API_KEY: "abc-1234",
  TMX_ORG_ID: "abc-1234",
};

describe("getAwsSecrets (using default mocked constants)", () => {
  beforeEach(() => {
    // Reset mocks and cache before each test
    secretsManagerMock.reset();
    clearCache();
    // Spy on console.error (for tests that expect an error to be logged)
    vi.spyOn(console, "error").mockImplementation(() => {});
    // Use fake timers if needed (for cache expiration tests)
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it("should successfully fetch and cache secrets", async () => {
    // Arrange: mock successful response from Secrets Manager
    secretsManagerMock.on(GetSecretValueCommand).resolves({
      SecretString: JSON.stringify(mockValidData),
    });

    // Act: fetch the secrets
    const secrets = await getAwsSecrets();

    // Assert: secrets are correct and call was made only once
    expect(secrets).toEqual(mockValidData);
    expect(secretsManagerMock.calls()).toHaveLength(1);
  });

  it("should use cached secrets when within cache duration", async () => {
    // Arrange: mock successful response
    secretsManagerMock.on(GetSecretValueCommand).resolves({
      SecretString: JSON.stringify(mockValidData),
    });

    // Act: first call caches the secrets
    await getAwsSecrets();
    // The second call should use the cache
    const secrets = await getAwsSecrets();

    // Assert: verify the secrets and that AWS was called only once
    expect(secrets).toEqual(mockValidData);
    expect(secretsManagerMock.calls()).toHaveLength(1);
  });

  it("should fetch new secrets when cache expires", async () => {
    // Arrange: mock successful response
    secretsManagerMock.on(GetSecretValueCommand).resolves({
      SecretString: JSON.stringify(mockValidData),
    });

    // Act: first call caches the secrets
    await getAwsSecrets();

    // Advance time past the cache duration (using fake timers)
    vi.advanceTimersByTime(1000 * 60 * 60 + 1000); // KEY_CACHE_DURATION + 1 second

    // Act: second call should fetch new secrets
    const secrets = await getAwsSecrets();

    // Assert: AWS should have been called twice
    expect(secrets).toEqual(mockValidData);
    expect(secretsManagerMock.calls()).toHaveLength(2);
  });

  it("should throw error when required keys are missing", async () => {
    // Arrange: mock response with missing keys
    const invalidSecretData = {
      ENCRYPTION_PUBLIC_KEY: "mock-key",
      // Other keys missing
    };

    secretsManagerMock.on(GetSecretValueCommand).resolves({
      SecretString: JSON.stringify(invalidSecretData),
    });

    // Act + Assert: expect getAwsSecrets() to throw an error about missing keys
    await expect(getAwsSecrets()).rejects.toThrow(
      "Secrets Manager call failed",
    );
  });

  it("should throw error when AWS Secrets Manager fails", async () => {
    // Arrange: simulate an AWS error
    secretsManagerMock
      .on(GetSecretValueCommand)
      .rejects(new Error("AWS Error"));

    // Act + Assert: expect the error string defined in ERROR_STRINGS
    await expect(getAwsSecrets()).rejects.toThrow(
      "Secrets Manager call failed",
    );
    expect(console.error).toHaveBeenCalled();
  });

  it("should throw error when SecretString is invalid JSON", async () => {
    // Arrange: mock an invalid JSON in SecretString
    secretsManagerMock.on(GetSecretValueCommand).resolves({
      SecretString: "invalid-json",
    });

    // Act + Assert: expect the error string defined in ERROR_STRINGS
    await expect(getAwsSecrets()).rejects.toThrow(
      "Secrets Manager call failed",
    );
    expect(console.error).toHaveBeenCalled();
  });
});

//
// ─── TEST FOR WHEN SECRET_KEY_ARN IS NOT SET ────────────────────────────────
// In this block we want to simulate that SECRET_KEY_ARN is not defined. To do so,
// we reset modules and use vi.doMock to provide a stubbed constants module where
// SECRET_KEY_ARN is undefined.
//
describe("getAwsSecrets when SECRET_KEY_ARN is not set", () => {
  beforeEach(() => {
    // Reset module registry so that subsequent dynamic import will pick up changes
    vi.resetModules();
    // Use fake timers if needed
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    // Reset modules so that other tests are not affected
    vi.resetModules();
  });

  it("should throw error when SECRET_KEY_ARN is not set", async () => {
    // Dynamically mock the constants module with SECRET_KEY_ARN undefined
    vi.doMock("../../src-lambda/helpers/constants", () => {
      return {
        AWS_SECRETS_REQUIRED_KEYS: ["TMX_API_KEY", "OAK_API_KEY", "TMX_ORG_ID"],
        KEY_CACHE_DURATION: 1000 * 60 * 60, // 1 hour in ms
        SECRET_KEY_ARN: undefined, // simulate missing ARN
        ERROR_STRINGS: {
          KEY_ARN_NOT_SET: "Key ARN not set",
          SECRETS_MANAGER_FAILED: "Secrets Manager call failed",
        },
      };
    });

    // Dynamically import the module under test so it uses the above constants
    const { getAwsSecrets } = await import(
      "../../src-lambda/services/get-aws-secrets"
    );

    // Act + Assert: calling getAwsSecrets() should now throw the "Key ARN not set" error
    await expect(getAwsSecrets()).rejects.toThrow("Key ARN not set");
  });
});
