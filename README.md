# cdk-ecs-ghost
Create a Ghost Blog with AWS ECS. Deployed using the AWS CDK. This project is a fully self contained deployment of Ghost (https://ghost.org/)

# Prerequisites

## AWS CLI & Account
This is an AWS CDK Project meant for an AWS Account. For the easiest time deploying it is recommended to setup the AWS CLI on your local computer and configure your `[default]` profile to authenticate with your AWS Account in your desired region. See the following links for setting up:

**AWS Account Setup:** 
- https://aws.amazon.com/premiumsupport/knowledge-center/create-and-activate-aws-account/

**AWS CLI Setup:** 
- https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-getting-started.html
- https://docs.aws.amazon.com/cdk/v2/guide/cli.html
## Nodejs & AWS CDK
The project is build using CDKv2. You will need it installed on your system. This can be done by installing the latest LTS of Nodejs (https://nodejs.org/en/download/) then by running the following command:
```bash
npm install -g aws-cdk
```

# Quick Setup
1. Clone the repository
2. `cd` into the project
3. Open `conf/configuration.ts` and set your domain name
3. Run `npm install`
4. Run `npx cdk deploy`
5. Wait for the CDK to complete deploying the project to your account

By default cdk-ecs-ghost sets up all DNS with AWS Route53. You will need to login to your account and find your Nameservers
and point whomever owns your domain to Route53

# Developer Notes
- Project is still under heavy development. Nothing has been tested so far

