// src/handlers/queue-processor.ts

import { getAwsSecrets } from '../../services/get-aws-secrets';
import { SQSEvent } from 'aws-lambda';
import { SQSBodyParser } from '../../helpers/sqs-body-parser';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

import { Logger } from "@aws-lambda-powertools/logger";
import { Metrics } from "@aws-lambda-powertools/metrics";

import { POWERTOOLS_SERVICE_NAME } from "../../helpers/constants";

// Powertools
const TOOL_NAME = `${POWERTOOLS_SERVICE_NAME}-checkout-processor`;

// Initialize Powertools
export const logger = new Logger({ serviceName: TOOL_NAME });
export const metrics = new Metrics({
  namespace: POWERTOOLS_SERVICE_NAME,
  serviceName: TOOL_NAME,
});

const s3Client = new S3Client({}); // <-- You need an S3Client instance

export const handler = async (event: SQSEvent) => {

  const { TMX_API_KEY, OAK_API_KEY } = await getAwsSecrets();
  logger.info("API-KEYS", { TMX_API_KEY, OAK_API_KEY });
  metrics.addMetric("Success", "Count", 1);

  await Promise.all(
    event.Records.map(async (record) => {
      // Each record.body is your message text
      const messageBody = record.body;
      // do whatever processing you need
      const data = await SQSBodyParser(
        messageBody
      );

      console.log(JSON.stringify(data, null, 2));

      try {
        await s3Client.send(
          new PutObjectCommand({
            Bucket: process.env.BUCKET_NAME, // Must be set in environment variables
            // @ts-expect-error TODO: Fix this
            Key: `demo/tmx/${data?.data?.["session-id"]}.json`,
            Body: JSON.stringify(data),
            ContentType: 'application/json',
          }),
        );
      } catch (error) {
        console.error('Failed to write to S3:', error);
        throw error; // or handle it based on your needs
      }
    }),
  );
};
