import { describe, it, expect, vi, beforeEach } from "vitest";
import { handler } from "../../src-lambda/services/rotate-aws-secrets";
import {
  PutSecretValueCommand, // We'll check calls to this in the tests
} from "@aws-sdk/client-secrets-manager";
import { EcMakeCryptKeys, EcMakeSigKeys } from "@justinwwolcott/ez-web-crypto";
//
// 1) Define 'mockSend' at the top-level so it's in the same scope
//
const mockSend = vi.fn();

//
// 2) Mock AWS Secrets Manager exports
//
vi.mock("@aws-sdk/client-secrets-manager", () => {
  // We can define these as mock functions (so Vitest can track calls).
  const MockGetSecretValueCommand = vi.fn();
  const MockPutSecretValueCommand = vi.fn();

  return {
    SecretsManagerClient: vi.fn(() => ({ send: mockSend })),
    GetSecretValueCommand: MockGetSecretValueCommand,
    PutSecretValueCommand: MockPutSecretValueCommand,
  };
});

//
// 3) Mock the crypto library
//
vi.mock("@justinwwolcott/ez-web-crypto", () => {
  return {
    EcMakeCryptKeys: vi.fn(),
    EcMakeSigKeys: vi.fn(),
  };
});

describe("rotate-aws-secrets.ts", () => {
  // Mock data for generated keys
  const mockEncryptionKeys = {
    publicKey: "encryption-public-key",
    privateKey: "encryption-private-key",
    rawPublicKey: new Uint8Array([1, 2, 3]),
    rawPrivateKey: new Uint8Array([4, 5, 6]),
    rawPublicKeyLite: "s8ej8asdf==",
  };
  const mockSignatureKeys = {
    publicKey: "signature-public-key",
    privateKey: "signature-private-key",
    rawPublicKey: new Uint8Array([7, 8, 9]),
    rawPrivateKey: new Uint8Array([10, 11, 12]),
  };

  // Mock secret / version data
  const mockSecretArn =
    "arn:aws:secretsmanager:us-east-1:123456789012:secret:my-secret";
  const mockVersionId = "version-id-123";

  beforeEach(() => {
    // Clear mocks between tests
    vi.clearAllMocks();

    // Reset environment variables
    process.env.AWS_REGION = "us-east-1";
    process.env.SECRET_ARN = mockSecretArn;

    // Configure our crypto mock to resolve with mock keys
    //
    vi.mocked(EcMakeCryptKeys).mockResolvedValue(mockEncryptionKeys as any);
    vi.mocked(EcMakeSigKeys).mockResolvedValue(mockSignatureKeys);

    // By default, let the Secrets Manager call succeed
    mockSend.mockResolvedValue({ VersionId: mockVersionId });
  });

  it("should generate new keys and update AWS Secrets Manager", async () => {
    await handler();

    // 1) Keys are generated
    expect(EcMakeCryptKeys).toHaveBeenCalledWith(true);
    expect(EcMakeSigKeys).toHaveBeenCalledWith(true);

    // 2) Secrets Manager is updated with the correct JSON
    const expectedSecretValue = JSON.stringify({
      ENCRYPTION_PUBLIC_KEY: mockEncryptionKeys.publicKey,
      ENCRYPTION_PRIVATE_KEY: mockEncryptionKeys.privateKey,
      SIGNATURE_PUBLIC_KEY: mockSignatureKeys.publicKey,
      SIGNATURE_PRIVATE_KEY: mockSignatureKeys.privateKey,
    });
    expect(PutSecretValueCommand).toHaveBeenCalledWith({
      SecretId: mockSecretArn,
      SecretString: expectedSecretValue,
    });

    // 3) The AWS command is actually sent
    expect(mockSend).toHaveBeenCalled();
  });

  it("should throw an error if SECRET_ARN is not set", async () => {
    // Remove SECRET_ARN
    delete process.env.SECRET_ARN;

    // Now calling the handler should throw because we do a check in code
    await expect(handler()).rejects.toThrow(
      "SECRET_ARN environment variable is not set",
    );
  });

  it("should throw an error if AWS Secrets Manager update fails", async () => {
    // Force the mock to reject
    const mockError = new Error("AWS Secrets Manager error");
    mockSend.mockRejectedValue(mockError);

    await expect(handler()).rejects.toThrow(mockError);
  });

  it("should handle errors during key generation", async () => {
    // Force key generation to fail
    const mockError = new Error("Key generation failed");
    vi.mocked(EcMakeCryptKeys).mockRejectedValue(mockError);

    await expect(handler()).rejects.toThrow(mockError);
  });
});
