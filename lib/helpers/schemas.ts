import { JsonSchema, JsonSchemaType } from "aws-cdk-lib/aws-apigateway";

// Flattened + typed schema for your "checkout" model
export const checkoutSchemaForAPIGW: JsonSchema = {
  type: JsonSchemaType.OBJECT,
  required: ["session-id"],
  additionalProperties: false,
  properties: {
    "session-id": {
      type: JsonSchemaType.STRING,
      minLength: 1,
      maxLength: 255,
    },
  },
};

export const trackerSchemaForAPIGW: JsonSchema = {
  type: JsonSchemaType.OBJECT,
  required: ["sessionId"],
  additionalProperties: true, // Reject any properties beyond the ones listed above
  properties: {
    sessionId: { type: JsonSchemaType.STRING },
  },
};
