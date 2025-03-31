// test/handlers/end-points/checkout.test.ts
import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { APIGatewayProxyEvent } from "aws-lambda";
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";

// IMPORTANT: Mock the powertools logger BEFORE importing modules that use it.
vi.mock("@aws-lambda-powertools/logger", () => {
  return {
    Logger: vi.fn().mockImplementation(() => ({
      info: vi.fn(),
      error: vi.fn(),
      // add other methods if needed
    })),
  };
});

import {
  handler,
  logger,
} from "../../../src-lambda/handlers/end-points/checkout";
import { mockClient } from "aws-sdk-client-mock";
import { MOCK_CONTEXT } from "../../constants";
import { _clearDeduplicateCache } from "../../../src-lambda/helpers/middy-helpers";

const MOCK_CIPHER_MATERIAL = "dGVzdExxxxxxxtleTE=";

// Create a mock for SNSClient
const snsMock = mockClient(SNSClient);

// Create a properly stringified event body
const PASSING_PAYLOAD = {
  "session-id": MOCK_CIPHER_MATERIAL,
};

// Create a stock passing event that will pass schema validation
const PASSING_EVENT: Partial<APIGatewayProxyEvent> = {
  headers: {
    "content-type": "application/json",
    "user-agent": "test-agent",
  },
  body: JSON.stringify(PASSING_PAYLOAD),
  requestContext: {
    identity: { sourceIp: "1.2.3.4" },
  } as any,
};

// ----------------------------------------------------------------------------
//
// ----------------------------------------------------------------------------
describe.sequential("checkout handler", () => {
  beforeEach(() => {
    snsMock.reset(); // reset any previous configurations / calls
    process.env.CHECKOUT_TOPIC_ARN = "test:topic:arn";
    vi.clearAllMocks();
    _clearDeduplicateCache();
  });

  afterEach(() => {
    snsMock.reset();
    vi.resetAllMocks();
    delete process.env.CHECKOUT_TOPIC_ARN; // Clean up env var
  });

  // ----------------------------------------------------------------------------
  //
  // ----------------------------------------------------------------------------
  test("successfully publishes message to SNS with complete payload", async () => {
    snsMock.on(PublishCommand).resolves({});

    const event = JSON.parse(JSON.stringify(PASSING_EVENT));

    const result = await handler(event as any, MOCK_CONTEXT);

    const calls = snsMock.calls(); // Get all mock calls

    expect(calls.length).toBe(1);

    // Check the published message format
    const publishCall = calls[0];

    expect(publishCall.args[0].input).toEqual({
      TopicArn: "test:topic:arn",
      Message: expect.stringContaining(MOCK_CIPHER_MATERIAL), // Should contain our base64 publicKey
    });

    expect(result.statusCode).toBe(200);
  });

  // ----------------------------------------------------------------------------
  //
  // ----------------------------------------------------------------------------
  test("successfully publishes message to SNS with complete payload - REDUX", async () => {
    snsMock.reset();

    snsMock.on(PublishCommand).resolves({});

    const event = JSON.parse(JSON.stringify(PASSING_EVENT));

    const result = await handler(event as any, MOCK_CONTEXT);

    const calls = snsMock.calls(); // Get all mock calls

    expect(calls.length).toBe(1);

    // Check the published message format
    const publishCall = calls[0];

    expect(publishCall.args[0].input).toEqual({
      TopicArn: "test:topic:arn",
      Message: expect.stringContaining(MOCK_CIPHER_MATERIAL), // Should contain our base64 publicKey
    });

    expect(result.statusCode).toBe(200);
  });

  // ----------------------------------------------------------------------------
  //
  // ----------------------------------------------------------------------------
  test("handles null body correctly", async () => {
    snsMock.reset();
    snsMock.on(PublishCommand).resolves({});

    const event = JSON.parse(JSON.stringify(PASSING_EVENT));

    const badEvent = { ...event, body: null };

    const result = await handler(badEvent as any, MOCK_CONTEXT);

    const calls = snsMock.calls(); // Get all mock calls
    expect(calls.length).toBe(0);

    expect(result.statusCode).toBe(400);
  });

  // ----------------------------------------------------------------------------
  //
  // ----------------------------------------------------------------------------
  test("normalizes headers correctly", async () => {
    snsMock.reset();
    snsMock.on(PublishCommand).resolves({});

    const event = JSON.parse(JSON.stringify(PASSING_EVENT));

    const awkwardEvent = {
      ...event,
      headers: {
        "CONTENT-TYPE": "application/json",
        "User-Agent": "test-agent",
      },
    };

    const result = await handler(awkwardEvent as any, MOCK_CONTEXT);

    const calls = snsMock.commandCalls(PublishCommand);
    expect(calls.length).toBe(1);
    // Check that the headers in the message string have been normalized (e.g., lower-cased)
    expect(calls[0].args[0].input).toEqual({
      TopicArn: "test:topic:arn",
      Message: expect.stringContaining('"content-type"'),
    });

    expect(result.statusCode).toBe(200);
  });

  // ----------------------------------------------------------------------------
  //
  // ----------------------------------------------------------------------------
  test("throws error when CHECKOUT_TOPIC_ARN is not set", async () => {
    delete process.env.CHECKOUT_TOPIC_ARN;
    snsMock.reset();
    snsMock.on(PublishCommand).resolves({});
    const event = JSON.parse(JSON.stringify(PASSING_EVENT));
    const result = await handler(event as any, MOCK_CONTEXT);
    expect(result.statusCode).toBe(500);
    expect(result.body).toContain("An unexpected error occurred");
  });

  // ----------------------------------------------------------------------------
  //
  // ----------------------------------------------------------------------------
  test("handles SNS publish failure", async () => {
    snsMock.reset();
    snsMock.on(PublishCommand).resolves({});
    snsMock.on(PublishCommand).rejects(new Error("SNS Error"));
    const event = JSON.parse(JSON.stringify(PASSING_EVENT));
    const result = await handler(event as any, MOCK_CONTEXT);
    expect(result.statusCode).toBe(500);
    expect(result.body).toContain("An unexpected error occurred");
  });

  // ----------------------------------------------------------------------------
  //
  // ----------------------------------------------------------------------------
  test("handles missing sourceIp", async () => {
    snsMock.reset();
    snsMock.on(PublishCommand).resolves({});
    const event = JSON.parse(JSON.stringify(PASSING_EVENT));
    const badEvent = { ...event, requestContext: { identity: {} } };
    const result = await handler(badEvent as any, MOCK_CONTEXT);
    const calls = snsMock.commandCalls(PublishCommand);
    expect(calls.length).toBe(0);
    // Expect that the payload string shows a null or undefined ipAddress
    expect(result.statusCode).toBe(500);
  });

  // ----------------------------------------------------------------------------
  //
  // ----------------------------------------------------------------------------
  test("handles completely missing requestContext", async () => {
    snsMock.reset();
    snsMock.on(PublishCommand).resolves({});
    const eventMissingCtx: Partial<APIGatewayProxyEvent> = {
      ...PASSING_EVENT,
      requestContext: undefined,
    };

    const result = await handler(eventMissingCtx as any, MOCK_CONTEXT);

    expect(result.statusCode).toBe(500);
    expect(logger.error).toHaveBeenCalled();
  });

  // ----------------------------------------------------------------------------
  //
  // ----------------------------------------------------------------------------
  test("handles warmup events correctly", async () => {
    const warmupEvent = {
      source: "serverless-plugin-warmup",
    };

    await handler(warmupEvent as any, MOCK_CONTEXT);

    // For warmup events, no SNS publish should be performed.

    expect(snsMock.commandCalls(PublishCommand).length).toBe(0);
  });
});
