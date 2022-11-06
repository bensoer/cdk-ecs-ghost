import { Duration } from "aws-cdk-lib"

export interface HealthCheckSettings {
    /**
     * How frequently to ping the ECS Container
     */
    interval: Duration,
    /**
     * How many successful pings to be considered healthy
     */
    healthyThresholdCount: number,
    /**
     * How many failed pings to be considered unhealthy
     */
    unhealthyThresholdCount: number,
    /**
     * How long to wait for a response from the Container
     */
    timeout: Duration,

    /**
     * How long ECS will wait until it started listening to
     * healthcheck results. Once it starts listening, if they
     * are failing, ECS will deprovision the instance and
     * spawn a new one
     */
    healthCheckGracePeriod: Duration
}

export interface VPCSettings {
    /**
     * Provide a custom CIDR range for the VPC the ECS Cluster and all components will
     * be hosted within
     */
    vpcCIDRRange : string

    /**
     * Number of NAT Gateways for the VPC. More NATs cost more. Default is 1 to save
     * cost, but the AWS recommended amouint is 3
     */
    numberOfNatGateways: number

    /**
     * Enable Service Endpoints within the VPC. This will route requests to ECR, S3, CloudWatch and
     * SecretsManager via a Service Endpoint rather then through the NAT gateway. This helps reduce cost.
     * By default this is enabled
     */
    enableServiceEndpoints: boolean
}

export interface Settings {
    /**
     * Value to prefix all names of things created in the stack. Use to ensure naming schemes are unique
     */
    prefixName:string

    /**
     * Logging group output from ECS
     */
    loggingPrefix: string

    /**
     * Explicite name for the Ghost Blog ECS Container
     */
    ghostBlogContainerName?:string

    /**
     * Explicite name for the Ghost Blog ECS Service
     */
    ghostBlogServiceName?:string

    /**
     * The domain name to resolve to your ghost blog
     */
    domainName: string

    /**
     * The name of the database
     */
    databaseName: string

    /**
     * Name of the sticky cookie used between the ALB and ECS
     */
    stickyCookieName: string

    /**
     * Settings for ECS Container health checking
     */
    healthCheck: HealthCheckSettings

    /**
     * ECS Cluster Name
     */
    clusterName? : string

    /**
     * Name of the S3 Asset bucket that stores Ghost Blog Images.
     * NOTE: prefixName does not effect this value. undefined assetBucketName
     * will result in a random generated bucket name by the CDK and CloudFormation
     */
    assetBucketName?: string

    /**
     * Settings for configuring the VPC created with the deployment
     */
    vpcSettings: VPCSettings
    

}