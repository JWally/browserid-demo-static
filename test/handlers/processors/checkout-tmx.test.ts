import { describe, it, expect, vi, beforeEach, afterEach, Mock } from "vitest";
import type { SQSEvent } from "aws-lambda";

// Import the handler from the file under test
import { handler } from "../../../src-lambda/handlers/processors/checkout-tmx";
// Import the dependencies to control their mocked behavior
import { getAwsSecrets } from "../../../src-lambda/services/get-aws-secrets";
import { SQSBodyParser } from "../../../src-lambda/helpers/sqs-body-parser";

// Mock the getAwsSecrets module
vi.mock("../../../src-lambda/services/get-aws-secrets", () => ({
  getAwsSecrets: vi.fn(),
}));

// Mock the SQSBodyParser module
vi.mock("../../../src-lambda/helpers/sqs-body-parser", () => ({
  SQSBodyParser: vi.fn(),
}));

describe("checkout-tmx handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("propagates errors from SQSBodyParser", async () => {
    const fakeSecrets = {
      ENCRYPTION_PRIVATE_KEY: "private-key",
      SIGNATURE_PUBLIC_KEY: "public-key",
    };

    // Configure getAwsSecrets to resolve to valid keys
    (getAwsSecrets as Mock).mockResolvedValue(fakeSecrets);

    // Make SQSBodyParser reject with an error
    const parserError = new Error("Parsing failed");
    (SQSBodyParser as Mock).mockRejectedValue(parserError);

    // Create a dummy SQSEvent with one record
    const event: SQSEvent = {
      Records: [{ body: "A test message" } as any],
    };

    // We expect the handler to propagate the error thrown by SQSBodyParser.
    await expect(handler(event)).rejects.toThrow("Parsing failed");
  });
});
