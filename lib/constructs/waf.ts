import * as cdk from "aws-cdk-lib";
import * as wafv2 from "aws-cdk-lib/aws-wafv2";
import { Construct } from "constructs";

interface WafConstructProps {
  environment: string;
  apiGateway: cdk.aws_apigateway.RestApi;
}

export class WafConstruct extends Construct {
  constructor(scope: Construct, id: string, props: WafConstructProps) {
    super(scope, id);
    const { environment, apiGateway } = props;

    /**
     * Create WAF ACL with the following rules:
     *
     * 1) AWS Managed Common Rule Set (priority 0)
     *    - Provides pre-configured protections against common exploits (SQL Injection, XSS, etc.)
     *
     * 2) RateLimitIP (priority 1)
     *    - Blocks IP addresses if they exceed 150 requests in a certain time window (AWS-managed behavior).
     *
     * 3) LimitBodySize200KB (priority 2)
     *    - Blocks requests whose body exceeds 200 KB. Good for preventing giant requests or certain DoS vectors.
     *
     * 4) ChallengeSuspiciousUA (priority 3)
     *    - Challenges requests (cookie/JavaScript puzzle) if the User-Agent suggests a non-browser tool like 'curl' or 'Python'.
     *      This helps weed out simple scripts, while real browsers pass automatically.
     *
     * 5) BlockCertainCountry (priority 4)
     *    - Example geo match rule that blocks traffic from, say, "CN" (China). You can adjust the country list as needed.
     *      Good if you want to explicitly block traffic from certain regions.
     */

    // Create WAF ACL
    const webAcl = new wafv2.CfnWebACL(this, `${environment}-fingerprint-waf`, {
      defaultAction: { allow: {} }, // Default to allow if no rules block/challenge
      scope: "REGIONAL",
      visibilityConfig: {
        cloudWatchMetricsEnabled: true,
        metricName: `${environment}-fingerprint-waf-metrics`,
        sampledRequestsEnabled: true,
      },
      rules: [
        // 1) AWS Managed Common Rule Set
        // {
        //   name: 'AWSManagedCommonVulns',
        //   priority: 0,
        //   statement: {
        //     managedRuleGroupStatement: {
        //       name: 'AWSManagedRulesCommonRuleSet', // covers common vulnerabilities
        //       vendorName: 'AWS',
        //       excludedRules: [], // or specify if you want to exclude certain rules
        //     },
        //   },
        //   overrideAction: { none: {} }, // 'none' means let the sub-rules decide block/allow
        //   visibilityConfig: {
        //     sampledRequestsEnabled: true,
        //     cloudWatchMetricsEnabled: true,
        //     metricName: `${environment}-CommonRuleSet`,
        //   },
        // },

        // 2) Basic rate limiting per IP
        {
          name: "RateLimitIP",
          priority: 1,
          statement: {
            rateBasedStatement: {
              limit: 150, // 50 requests per 5 minutes per IP (just as an example)
              aggregateKeyType: "IP",
            },
          },
          action: {
            block: {
              customResponse: {
                responseCode: 429,
                customResponseBodyKey: "RateLimitExceeded",
              },
            },
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: `${environment}-RateLimit`,
          },
        },

        // 3) Body Size Limit ~200KB
        {
          name: "LimitBodySize200KB",
          priority: 2,
          statement: {
            sizeConstraintStatement: {
              fieldToMatch: { body: { oversizeHandling: "CONTINUE" } },
              textTransformations: [{ priority: 0, type: "NONE" }],
              comparisonOperator: "GT",
              size: 102400, // 100 KB in bytes
            },
          },
          action: { block: {} },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: `${environment}-BodySizeLimit`,
          },
        },

        // 4) Challenge suspicious user agents like 'curl', 'python-requests'
        // {
        //   name: "ChallengeSuspiciousUA",
        //   priority: 3,
        //   statement: {
        //     orStatement: {
        //       statements: [
        //         {
        //           byteMatchStatement: {
        //             fieldToMatch: { singleHeader: { Name: "User-Agent" } },
        //             positionalConstraint: "CONTAINS",
        //             searchString: "curl",
        //             textTransformations: [{ priority: 0, type: "LOWERCASE" }],
        //           },
        //         },
        //         {
        //           byteMatchStatement: {
        //             fieldToMatch: { singleHeader: { Name: "User-Agent" } },
        //             positionalConstraint: "CONTAINS",
        //             searchString: "python",
        //             textTransformations: [{ priority: 0, type: "LOWERCASE" }],
        //           },
        //         },
        //       ],
        //     },
        //   },
        //   action: {
        //     challenge: {}, // will present a JavaScript/cookie challenge
        //   },
        //   visibilityConfig: {
        //     sampledRequestsEnabled: true,
        //     cloudWatchMetricsEnabled: true,
        //     metricName: `${environment}-SuspiciousUA`,
        //   },
        // },

        // 5) Example geo match rule to block traffic from a particular country
        {
          name: "BlockCertainCountry",
          priority: 4,
          statement: {
            geoMatchStatement: {
              // For demonstration, let's block 'CN'. Adjust as needed.
              countryCodes: ["CN", "RU"],
            },
          },
          action: { block: {} },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: `${environment}-GeoMatchBlock`,
          },
        },
      ],

      customResponseBodies: {
        RateLimitExceeded: {
          content: '{"message":"Rate limit exceeded"}',
          contentType: "APPLICATION_JSON",
        },
      },
    });

    // Associate WAF with API Gateway
    new wafv2.CfnWebACLAssociation(this, `${environment}-waf-api-association`, {
      resourceArn: apiGateway.deploymentStage.stageArn,
      webAclArn: webAcl.attrArn,
    });
  }
}
