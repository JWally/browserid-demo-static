import { Context } from "aws-lambda";

// Create a mock context that we can reuse
export const MOCK_CONTEXT: Context = {
  callbackWaitsForEmptyEventLoop: false,
  functionName: "test",
  functionVersion: "1",
  invokedFunctionArn: "arn:test",
  memoryLimitInMB: "128",
  awsRequestId: "test-id",
  logGroupName: "test-group",
  logStreamName: "test-stream",
  getRemainingTimeInMillis: () => 1000,
  done: () => {},
  fail: () => {},
  succeed: () => {},
};
