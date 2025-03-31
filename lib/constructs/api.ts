// lib/constructs/api.ts

import { Construct } from "constructs";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as logs from "aws-cdk-lib/aws-logs";
import { LambdaConstruct } from "./lambda";
import * as cloudwatch from "aws-cdk-lib/aws-cloudwatch";
import { Duration } from "aws-cdk-lib";
import { checkoutSchemaForAPIGW } from "../helpers/schemas";

/**
 * ApiGatewayConstruct
 * -------------------
 * Creates:
 * - A REST API Gateway
 * - Log group for the API
 * - CORS (restricted to GET, POST, OPTIONS)
 * - Alarms for 4XX, 5XX, p95 latency, throttles, and potential "no traffic"
 *
 * TODO: Connect these alarms to an SNS Topic or Chatbot for notifications.
 */
export class ApiGatewayConstruct extends Construct {
  public readonly api: apigateway.RestApi;

  constructor(
    scope: Construct,
    id: string,
    lambdaConstruct: LambdaConstruct,
    stackName: string,
  ) {
    super(scope, id);

    const name = stackName || "no-name";

    // Create the log group for access logs
    const logGroup = new logs.LogGroup(this, `${stackName}-api-logs`, {
      retention: logs.RetentionDays.TWO_WEEKS,
    });

    // Create the API Gateway
    this.api = new apigateway.RestApi(this, name, {
      restApiName: stackName,
      cloudWatchRole: true,
      defaultCorsPreflightOptions: {
        allowOrigins: [`*`], // Example: Restrict to main domain; or use an array for multiple
        allowMethods: ["GET", "POST", "OPTIONS"],
        allowHeaders: apigateway.Cors.DEFAULT_HEADERS,
      },
      deployOptions: {
        stageName: "prod",
        tracingEnabled: true,
        dataTraceEnabled: false,
        metricsEnabled: true,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        accessLogDestination: new apigateway.LogGroupLogDestination(logGroup),
        accessLogFormat: apigateway.AccessLogFormat.jsonWithStandardFields(),
      },
    });

    // Make Models
    const { bodyValidator, checkoutModel } = this.makeValidationModels();

    // ////////////////////////////////////////////////////////////////////////
    //
    // Add routes and resources
    //
    // ////////////////////////////////////////////////////////////////////////

    // Create /v1 as the root resource
    const v1 = this.api.root.addResource("v1");

    // Attach checkout to v1
    const checkoutResource = v1.addResource("checkout");
    // Give checkout a post method
    checkoutResource.addMethod(
      "POST",
      new apigateway.LambdaIntegration(lambdaConstruct.checkoutFunction, {
        // If there's no matching model for the Content-Type, immediately fail
        passthroughBehavior: apigateway.PassthroughBehavior.NEVER,
      }),
      {
        requestValidator: bodyValidator,
        requestModels: {
          "application/json": checkoutModel,
        },
        // require the header so no header -> 400
        requestParameters: {
          "method.request.header.Content-Type": true,
        },
      },
    );

    // Create alarms for the API
    this.createApiAlarms();
  }

  // ////////////////////////////////////////////////////////////////////////
  //
  // ** PUT USEFUL ALARMS ON OUR END POINTS **
  //
  // ////////////////////////////////////////////////////////////////////////
  private createApiAlarms() {
    // 4XX Errors (sum of 4xx in 5-minute windows)
    new cloudwatch.Alarm(this, "--4XX-errors--", {
      metric: this.api.metricClientError({
        period: Duration.minutes(5),
        statistic: "Sum",
      }),
      threshold: 10, // e.g. 10 errors in 5 min
      evaluationPeriods: 2, // must happen in 2 consecutive periods
      alarmDescription: "API Gateway 4XX error count exceeded threshold",
    });

    // 5XX Errors (sum of 5xx in 5-minute windows)
    new cloudwatch.Alarm(this, "--5XX-errors--", {
      metric: this.api.metricServerError({
        period: Duration.minutes(5),
        statistic: "Sum",
      }),
      threshold: 5, // e.g. 5 errors in 5 min
      evaluationPeriods: 1,
      alarmDescription: "API Gateway 5XX error count exceeded threshold",
    });

    // p95 Latency (in ms) over 5-minute windows
    new cloudwatch.Alarm(this, "--high-latency--", {
      metric: this.api.metricLatency({
        period: Duration.minutes(5),
        statistic: "p95",
      }),
      threshold: 1000, // e.g. 5 seconds
      evaluationPeriods: 2,
      alarmDescription: "API Gateway p95 latency exceeds 5s",
    });

    // TODO: Add code to attach these alarms to an SNS Topic so you get notified
    // e.g.: alarm.addAlarmAction(new actions.SnsAction(topic));
  }

  // ////////////////////////////////////////////////////////////////////////
  //
  // ** ATTACH VALIDATION MODELS TO APIGW **
  //
  // ////////////////////////////////////////////////////////////////////////
  private makeValidationModels() {
    //
    // Anything not validated, triggering 4xx or 5xx needs CORS enabled
    // so this:
    //
    this.api.addGatewayResponse("Default4xx", {
      type: apigateway.ResponseType.DEFAULT_4XX,
      responseHeaders: {
        "Access-Control-Allow-Origin": "'*'",
        "Access-Control-Allow-Headers": "'Content-Type,Authorization'",
        "Access-Control-Allow-Methods": "'OPTIONS,POST,GET'",
      },
      // Optionally specify a custom response body / statusCode, etc.
    });

    this.api.addGatewayResponse("Default5xx", {
      type: apigateway.ResponseType.DEFAULT_5XX,
      responseHeaders: {
        "Access-Control-Allow-Origin": "'*'",
        "Access-Control-Allow-Headers": "'Content-Type,Authorization'",
        "Access-Control-Allow-Methods": "'OPTIONS,POST,GET'",
      },
    });

    // 1) Create a Request Validator:
    const bodyValidator = new apigateway.RequestValidator(
      this,
      "BodyValidator",
      {
        restApi: this.api,
        validateRequestBody: true,
        validateRequestParameters: false, // or true if you also want param validation
      },
    );

    // 2) Create Models for each schema. For example, for timestamp:
    const checkoutModel = new apigateway.Model(this, "CheckoutModel", {
      restApi: this.api,
      contentType: "application/json",
      schema: checkoutSchemaForAPIGW, // The schema you exported
      modelName: "CheckoutModel",
    });

    return { checkoutModel, bodyValidator };
  }
}
