// src/handlers/queue-processor.ts
import { NestedValue } from "../../helpers/misc";

import { SQSEvent } from "aws-lambda";
import { SQSBodyParser } from "../../helpers/sqs-body-parser";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

import { Logger } from "@aws-lambda-powertools/logger";
import { Metrics } from "@aws-lambda-powertools/metrics";

import { POWERTOOLS_SERVICE_NAME } from "../../helpers/constants";
import { flattenObject, getCurrentDateInfo } from "../../helpers/misc";

export interface ParsedBody {
  data: {
    sessionId: string;
    // Whatever else your payload might hold
    [key: string]: unknown;
  };
  // If your root-level object has other properties, define them here
  [key: string]: unknown;
}

// Powertools
const TOOL_NAME = `${POWERTOOLS_SERVICE_NAME}-tracker-processor`;

// Initialize Powertools
export const logger = new Logger({ serviceName: TOOL_NAME });
export const metrics = new Metrics({
  namespace: POWERTOOLS_SERVICE_NAME,
  serviceName: TOOL_NAME,
});

const s3Client = new S3Client({});

export const handler = async (event: SQSEvent) => {
  await Promise.all(
    event.Records.map(async (record) => {
      // Each record.body is your message text
      const messageBody = record.body;

      // parse and extract data from the payload
      const data = (await SQSBodyParser(messageBody)) as ParsedBody;

      if (!data || !data.data) {
        throw new Error("no data returned from parser");
      }

      if (!data.data["sessionId"]) {
        throw new Error("no session id on data");
      }

      const sessionId: string = data.data["sessionId"];

      const DATE_INFO: NestedValue = getCurrentDateInfo() as NestedValue;

      const FLAT_DATA = flattenObject({ ...data, DATE_INFO });

      const ALL_DATA = {
        ...FLAT_DATA,
        RAW_DATA: JSON.stringify({ ...FLAT_DATA }),
      };

      try {
        await s3Client.send(
          new PutObjectCommand({
            Bucket: process.env.BUCKET_NAME, // set in environment variables
            Key: `demo/tracker-oak/${sessionId}.json`,
            Body: JSON.stringify(ALL_DATA),
            ContentType: "application/json",
          }),
        );
      } catch (error) {
        console.error("Failed to write to S3:", error);
        throw error;
      }
    }),
  );
};
