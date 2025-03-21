// constants.ts
export interface DomainConfig {
    domain: string;
    subdomain: string;
  }
  
  export const DOMAINS: DomainConfig[] = [
    { domain: 'wolcott.io', subdomain: 'demo' },
    { domain: 'mathfood.com', subdomain: 'demo' },
    { domain: 'bakesale.us', subdomain: 'demo' },
    { domain: 'discretevpn.net', subdomain: 'demo' },
    { domain: 'browserid.info', subdomain: 'demo'}
  ];
  
  export const CERTIFICATE_REGION = 'us-east-1';