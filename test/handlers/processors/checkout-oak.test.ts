import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
  type Mock,
} from "vitest";
import type { SQSEvent } from "aws-lambda";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// Import the handler from the file under test
import { handler } from "../../../src-lambda/handlers/processors/checkout-oak";

import { SQSBodyParser } from "../../../src-lambda/helpers/sqs-body-parser";

// Mock SQSBodyParser
vi.mock("../../../src-lambda/helpers/sqs-body-parser", () => ({
  SQSBodyParser: vi.fn(),
}));

describe("checkout-oak handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("propagates errors from SQSBodyParser", async () => {
    const parserError = new Error("Parsing failed");
    (SQSBodyParser as Mock).mockRejectedValue(parserError);

    const event: SQSEvent = { Records: [{ body: "A test message" } as any] };
    await expect(handler(event)).rejects.toThrow("Parsing failed");
  });

  it("throws error if no data is returned from parser", async () => {
    (SQSBodyParser as Mock).mockResolvedValue(null);

    const event: SQSEvent = { Records: [{ body: "Test message" } as any] };
    await expect(handler(event)).rejects.toThrow(
      "no data returned from parser",
    );
  });

  it("throws error if session id is missing on data", async () => {
    (SQSBodyParser as Mock).mockResolvedValue({ data: {} });

    const event: SQSEvent = { Records: [{ body: "Test message" } as any] };
    await expect(handler(event)).rejects.toThrow("no session id on data");
  });

  it("propagates error when S3 put fails", async () => {
    process.env.BUCKET_NAME = "my-bucket";
    const sessionId = "12345";
    (SQSBodyParser as Mock).mockResolvedValue({
      data: { "session-id": sessionId, other: "value" },
    });

    const s3Error = new Error("S3 error");
    vi.spyOn(S3Client.prototype, "send").mockRejectedValue(s3Error);

    const event: SQSEvent = { Records: [{ body: "Dummy message" } as any] };
    await expect(handler(event)).rejects.toThrow("S3 error");
  });

  it("successfully processes event and sends data to S3", async () => {
    process.env.BUCKET_NAME = "my-bucket";
    const sessionId = "12345";
    const parserData = { data: { "session-id": sessionId, other: "value" } };
    (SQSBodyParser as Mock).mockResolvedValue(parserData);

    // Cast the resolved value to 'any' to avoid type conflicts.
    const sendSpy = vi
      .spyOn(S3Client.prototype, "send")
      .mockResolvedValue({} as any);

    const event: SQSEvent = { Records: [{ body: "Dummy message" } as any] };
    await handler(event);

    expect(sendSpy).toHaveBeenCalledTimes(1);
    // Cast the command argument to PutObjectCommand to access the input property.
    const commandArg = sendSpy.mock.calls[0][0] as PutObjectCommand;
    expect(commandArg.input.Bucket).toBe("my-bucket");
    expect(commandArg.input.Key).toBe(`demo/oak/${sessionId}.json`);
    expect(commandArg.input.ContentType).toBe("application/json");

    // Verify that the command body is a JSON string that includes RAW_DATA
    const bodyObj = JSON.parse(commandArg.input.Body as string);
    expect(bodyObj.RAW_DATA).toBeDefined();
  });

  it("processes multiple records", async () => {
    process.env.BUCKET_NAME = "my-bucket";
    const sessionId1 = "session1";
    const sessionId2 = "session2";

    (SQSBodyParser as Mock).mockImplementation((message: string) => {
      if (message === "message1") {
        return Promise.resolve({
          data: { "session-id": sessionId1, other: "value1" },
        });
      } else if (message === "message2") {
        return Promise.resolve({
          data: { "session-id": sessionId2, other: "value2" },
        });
      }
      return Promise.resolve({ data: { "session-id": "unknown" } });
    });

    const sendSpy = vi
      .spyOn(S3Client.prototype, "send")
      .mockResolvedValue({} as any);

    const event: SQSEvent = {
      Records: [{ body: "message1" } as any, { body: "message2" } as any],
    };

    await handler(event);
    expect(sendSpy).toHaveBeenCalledTimes(2);
  });
});
