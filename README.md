# ms-oak-demo

This repository contains a CDK-based "microservice" that demonstrates and tests external fraud-detection integrations (ThreatMetrix, Signifyd's "Oak," etc.).

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Workflow & CI/CD Pipeline](#workflow--cicd-pipeline)
- [Personal Stacks & Deployment](#personal-stacks--deployment)
- [Secrets Manager Setup](#secrets-manager-setup)
- [Local Development (UI)](#local-development-ui)
- [Questions / Troubleshooting](#questions--troubleshooting)

## Architecture Overview

The system deploys:

- A static web app (React + Vite)
- A RESTful API (API Gateway + Lambda)
- Processors that publish data to S3 for later Athena queries

```
Browser / Automated Test
         |
         v
   Amazon API Gateway
         |
         v
   Lambda: checkout-handler
         |
         v
   SNS Topic: checkout-topic
         |
         v
   SQS Queues (One per "processor" - e.g. TMX, Oak)
         |
         v
   Lambda Processor(s): fetch external data, store result in S3
         |
         v
   Amazon S3 (JSON objects)
```

- **API**: A simple REST API (`/v1/checkout`) triggers a Lambda that publishes to an SNS topic.
- **SNS Topic**: Delivers messages to two SQS queues (one for ThreatMetrix data processing, one for Oak).
- **SQS & Processor Lambdas**: Each queue has a dedicated processor Lambda. The Lambdas fetch external data and store combined results in S3.
- **Static Site**: Deployed to an S3 bucket (with CloudFront). The site can call the API to simulate a "checkout" event.
- **Athena**: We have a dedicated Athena workgroup + Glue tables to query data stored in S3.

## Workflow & CI/CD Pipeline

### Normal Workflow

1. **Local Development**: Create a new feature branch, make changes, run tests.
2. **Pull Request**: Open a PR against the main branch.
3. **Merge**: Once approved, the merge triggers the CodePipeline.
4. **Pipeline**: The pipeline automatically:
   - Pulls the code from GitHub.
   - Runs `npm ci`, `npm run lint:fix`, `npm run test`.
   - Builds the static site (`npm run site:build`).
   - Synthesizes and deploys the CDK stacks to each environment (Dev, QA, UAT, Prod), with manual approvals in between.

### Pipeline Layout

- **Synth Step**: Installs dependencies, compiles code, runs tests, and synthesizes CloudFormation.
- **Stages**: Deploys successively to Dev → QA → UAT → Prod, pausing for manual approval between each environment.

If you only need to do a quick test in Dev, push your branch, merge to main (or open a PR that gets merged), and watch the pipeline's Dev stage.

## Personal Stacks & Deployment

In addition to the main pipeline environment, we also support personal dev stacks for specific users. For instance:

```javascript
new AppStack(app, "ms-oak-demo-dev-jw", {
  env: { account: "1234567890", region: "us-east-1" },
  environment: "dev-jw",
  stackName: "ms-oak-demo-dev-jw",
  rootDomain: "browserid.info",
  stage: "dev-jw",
  // ...
});
```

### Deploying Your Personal Stack

1. **CDK Bootstrap** (once per account/region):

   ```
   cdk bootstrap aws://1234567890/us-east-1
   ```

2. **Deploy your personal stack**:
   ```
   npx cdk deploy ms-oak-demo-dev-jw
   ```
   This will create your dedicated version of the resources (S3, API Gateway, WAF, etc.) with the `dev-jw` suffix.

If you only plan to use the shared "Dev" environment in the pipeline, you can skip personal stacks. But personal stacks are handy if you don't want to affect the main Dev environment.

## Secrets Manager Setup

We store sensitive values—such as TMX and Oak API keys—in AWS Secrets Manager. The CDK code expects these secrets to exist at a specific name/ARN. For example:

- `SECRET_KEY_ARN = <some-ARN-like> arn:aws:secretsmanager:...:secret:mysecret-xxxx`

- The JSON structure inside your secret must have the fields:
  - `TMX_API_KEY`
  - `TMX_ORG_ID`
  - `OAK_API_KEY`

### Creating the Secret Manually

1. In AWS Secrets Manager, create a new secret with these key-value pairs:

   ```json
   {
     "TMX_API_KEY": "your-threatmetrix-api-key",
     "TMX_ORG_ID": "your-threatmetrix-org-id",
     "OAK_API_KEY": "your-signifyd-oak-api-key"
   }
   ```

2. Note the ARN of the secret.

3. Set the environment variable (or context variable) `SECRET_KEY_ARN` to that ARN in your CDK context or your deployment environment.

The Lambdas will fetch this secret on startup (and cache it for a short period).

## Local Development (UI)

You can develop the front-end site locally using Vite:

1. **Install Dependencies**:

   ```
   npm ci
   ```

2. **Start Dev Server**:
   ```
   npm run site:dev
   ```
   This launches the local development server on (by default) http://localhost:3000.

### Mock API

Currently, the site expects to call an API at `api-<stage>.browserid.info/v1/checkout`. If you want local testing, either:

- Adjust the code in `src-site/src/utils/constants.ts` to point to a local Lambda or an offline environment,
- Or override the environment variables in `.env` for local.

3. **Build for Production** (optional):
   ```
   npm run site:build
   ```
   This command compiles the static site into `dist/`.

## Questions / Troubleshooting

- **SNS topic not working?** Check the subscription in the SQS queue and confirm the correct policy is in place.
- **Processor Lambdas not writing to S3?** Verify the `BUCKET_NAME` environment variable is set in each Lambda, and that the Secret is configured properly for external calls.
- **Auth / Domain issues?** Make sure you have your personal stack domain or you're hitting the correct environment domain.

For more details, check the `lib` directory for the constructs or ping the dev team in Slack.

That's it! If you have any questions, file a GitHub issue or reach out in our dev channel.
