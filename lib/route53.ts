// route53.ts
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import { Construct } from 'constructs';
import { DomainConfig } from './constants';

export class Route53 {
  public readonly hostedZones: Map<string, route53.IHostedZone>;

  constructor(scope: Construct, domains: DomainConfig[]) {
    this.hostedZones = new Map();
    
    for (const domain of domains) {
      const hostedZone = route53.HostedZone.fromLookup(scope, `HostedZone-${domain.domain}`, {
        domainName: domain.domain,
      });
      this.hostedZones.set(domain.domain, hostedZone);
    }
  }

  createAliasRecords(scope: Construct, distribution: targets.CloudFrontTarget, domains: DomainConfig[]) {
    domains.forEach((domain, index) => {
      const zone = this.hostedZones.get(domain.domain);
      if (!zone) return;

      new route53.ARecord(scope, `SiteAliasRecord-${domain.domain}`, {
        recordName: domain.subdomain,
        target: route53.RecordTarget.fromAlias(distribution),
        zone: zone,
      });
    });
  }
}