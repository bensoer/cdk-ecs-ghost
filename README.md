# cdk-ecs-ghost
Create a Ghost Blog with AWS ECS. Deployed using the AWS CDK. This project is a fully self contained deployment of Ghost (https://ghost.org/)

# Prerequisites
- Node v16+ installed
- AWS CLI installed and configured with `[default]` profile pointing to your account

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

