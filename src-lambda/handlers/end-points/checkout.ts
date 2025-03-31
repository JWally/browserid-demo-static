import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";
import createHttpError from "http-errors";

import { Logger } from "@aws-lambda-powertools/logger";
import { Metrics } from "@aws-lambda-powertools/metrics";

import middy from "@middy/core";
import httpHeaderNormalizer from "@middy/http-header-normalizer";
import httpErrorHandler from "@middy/http-error-handler";
import validator from "@middy/validator";
import warmup from "@middy/warmup";
import httpJsonBodyParser from "@middy/http-json-body-parser";
import { transpileSchema } from "@middy/validator/transpile";
import cors from "@middy/http-cors";

import { checkoutSchema } from "../schemas";
import { isWarmingUp, onWarmup } from "../../helpers/middy-helpers";
import { deduplicateMiddleware } from "../../helpers/middy-helpers";
import { POWERTOOLS_SERVICE_NAME } from "../../helpers/constants";

// Powertools
const TOOL_NAME = `${POWERTOOLS_SERVICE_NAME}-checkout`;

// Initialize Powertools
export const logger = new Logger({ serviceName: TOOL_NAME });
export const metrics = new Metrics({
  namespace: POWERTOOLS_SERVICE_NAME,
  serviceName: TOOL_NAME,
});

// Re-use the same client for all calls:
export const snsClient = new SNSClient({});

// This is the actual handler
export const lambdaHandler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  try {
    // ------------------------------------------------------------------------
    // 1) Pull the topic ARN from environment
    // ------------------------------------------------------------------------
    const topicArn = process.env.CHECKOUT_TOPIC_ARN;
    if (!topicArn) {
      throw new Error("CHECKOUT_TOPIC_ARN is not set");
    }

    // ------------------------------------------------------------------------
    // 2) Extract body, headers, and ipAddress
    // ------------------------------------------------------------------------
    const { body, headers } = event;
    const ipAddress = event.requestContext.identity.sourceIp;

    if (!ipAddress) throw new Error("No Ip Address on identity");
    if (!headers) throw new Error("No headers given on request");
    if (!body) throw new Error("No Body Provided on Event");

    // ------------------------------------------------------------------------
    // 3) Build Payload and send to topic
    // ------------------------------------------------------------------------
    const payload = { headers, ipAddress, body: body ?? null };
    await snsClient.send(
      new PublishCommand({
        TopicArn: topicArn,
        Message: JSON.stringify(payload),
      }),
    );

    logger.info("Successfully processed request", { ipAddress, payload });
    metrics.addMetric("Success", "Count", 1);
    // ------------------------------------------------------------------------
    // 4) Return successful update to client
    // ------------------------------------------------------------------------
    return {
      statusCode: 200,
      body: JSON.stringify({}),
    };
  } catch (error) {
    logger.error("Error processing request", { error });
    metrics.addMetric("Error", "Count", 1);
    throw createHttpError(500, "Internal Server Error");
  }
};

// Configure middleware stack
export const handler = middy(lambdaHandler)
  .use(warmup({ isWarmingUp, onWarmup }))
  .use(deduplicateMiddleware())
  .use(httpHeaderNormalizer())
  .use(httpJsonBodyParser())
  .use(validator({ eventSchema: transpileSchema(checkoutSchema) }))
  .use(cors({ origin: "*", credentials: true }))
  .use(
    httpErrorHandler({
      fallbackMessage: "An unexpected error occurred",
      logger: (error) => logger.error("HTTP error", { error }),
    }),
  );
