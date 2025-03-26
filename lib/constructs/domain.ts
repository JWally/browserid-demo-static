import { Construct } from "constructs";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as targets from "aws-cdk-lib/aws-route53-targets";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import * as apigateway from "aws-cdk-lib/aws-apigateway";

interface DomainConstructProps {
  rootDomain: string;
  api: apigateway.RestApi;
  stage: string;
  stackName: string;
  region: string;
}

export class DomainConstruct extends Construct {
  constructor(scope: Construct, id: string, props: DomainConstructProps) {
    super(scope, id);

    const { api, rootDomain, stage } = props;

    const domainNameString =
      stage === "prod" ? `api.${rootDomain}` : `api-${stage}.${rootDomain}`;

    const hostedZone = route53.HostedZone.fromLookup(this, "HostedZone", {
      domainName: rootDomain,
    });

    const certificate = new acm.DnsValidatedCertificate(
      this,
      "ApiCertificate",
      {
        domainName: domainNameString,
        hostedZone: hostedZone,
      },
    );

    const domainName = new apigateway.DomainName(this, "ApiDomain", {
      domainName: domainNameString,
      certificate,
      endpointType: apigateway.EndpointType.REGIONAL,
      securityPolicy: apigateway.SecurityPolicy.TLS_1_2,
    });

    new apigateway.BasePathMapping(this, "ApiMapping", {
      domainName,
      restApi: api,
      basePath: "",
    });

    new route53.ARecord(this, "ApiAliasRecord", {
      zone: hostedZone,
      recordName: domainNameString,
      target: route53.RecordTarget.fromAlias(
        new targets.ApiGatewayDomain(domainName),
      ),
    });
  }
}
