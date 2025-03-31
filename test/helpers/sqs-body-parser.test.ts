// /src/helpers/web-sqs-body-parser.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  parseJSON,
  SQSBodyParser,
} from "../../src-lambda/helpers/sqs-body-parser";

// Import the error strings so we can check error messages.
import { ERROR_STRINGS } from "../../src-lambda/helpers/constants";

// A helper function to reset mocks between tests.
beforeEach(() => {
  vi.clearAllMocks();
});

// ----------------------------------------------------------------------------
//
// ----------------------------------------------------------------------------

describe("parseJSON", () => {
  it("should parse a valid JSON string", () => {
    const jsonString = '{"foo":"bar"}';
    const result = parseJSON<{ foo: string }>(jsonString);
    expect(result).toEqual({ foo: "bar" });
  });
  // ----------------------------------------------------------------------------
  //
  // ----------------------------------------------------------------------------
  it("should return data as-is if not a string", () => {
    const data = { foo: "bar" };
    const result = parseJSON<{ foo: string }>(data);
    expect(result).toEqual(data);
  });
  // ----------------------------------------------------------------------------
  //
  // ----------------------------------------------------------------------------
  it("should throw an error if JSON parsing fails", () => {
    const invalidJson = '{"foo":bar}';
    expect(() => parseJSON(invalidJson)).toThrowError(
      ERROR_STRINGS.CANNOT_PARSE_JSON,
    );
  });
});
// ----------------------------------------------------------------------------
//
// ----------------------------------------------------------------------------
describe("WebSQSBodyParser", () => {
  // Helper: create a valid encryption payload.
  const payloadData = JSON.stringify({
    "session-id": "ABC-123",
  });

  // Assemble the nested payload structure.
  const messageBody = {
    body: payloadData,
    headers: { "Content-Type": "application/json" },
    ipAddress: "127.0.0.1",
  };

  const outerPayload = {
    Message: JSON.stringify(messageBody),
  };

  const payloadString = JSON.stringify(outerPayload);

  beforeEach(() => {
    // Reset all mocks completely between each test.
    vi.resetAllMocks();
  });

  // ----------------------------------------------------------------------------
  it("should process a valid SQS payload and return data along with headers and ipAddress", async () => {
    const result = await SQSBodyParser(payloadString);
    expect(result).toEqual({
      data: payloadData,
      headers: messageBody.headers,
      ipAddress: messageBody.ipAddress,
    });
  });

  // ----------------------------------------------------------------------------
  it("should throw an error if any of the parsing steps fail", async () => {
    // Provide an invalid outer payload.
    await expect(SQSBodyParser("invalid-json")).rejects.toThrowError(
      ERROR_STRINGS.CANNOT_PARSE_JSON,
    );
  });
});
