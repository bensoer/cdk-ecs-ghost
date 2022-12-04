import { Duration } from "aws-cdk-lib"
import { SslPolicy } from "aws-cdk-lib/aws-elasticloadbalancingv2"

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

/**
 * Required settings to import your own ALB
 */
export interface ImportALBSettings {
    /**
     * ARN of the ALB
     */
    arn: string
}

/**
 * 
 */
export interface ALBSettings {
    /**
     * Provide your own ALB to be imported. All other ALB related
     * settings will be ignored if this value is provided
     */
    importSettings?: ImportALBSettings

    sslPolicy: SslPolicy
}

/**
 * Required settings to import your own ECS Cluster
 */
export interface ImportECSSettings {
    /**
     * Name of the ECS Cluster
     */
    clusterName: string
    /**
     * The ARN of the ECS Cluster
     */
    clusterArn: string
    /**
     * The vpcID of the VPC the ECS Cluster is hosted in
     */
    vpcId: string,
    /**
     * A list of securityGroupIDs of the SecurityGroups in the VPC the ECS Cluster is hosted in
     */
    securityGroupIds: Array<string>
}

export interface ECSSettings {

    /**
     * Provide a name for the cluster. Default will have Cloudformation generate the name
     */
    clusterName?: string

    /**
     * Provide your own ECS cluster to import. All other settings in ECSSettings
     * will be ignore if this value is provided
     */
    importSettings? : ImportECSSettings
}

/**
 * Required settings to import your own VPC
 */
export interface ImportVPCSettings {
    vpcId: string
    securityGroupId: string
}

export interface VPCSettings {

    /**
     * Provide your own VPC to import. All other settings in VPCSettings
     * will be ignored if this value is provided.
     * 
     * Note: cdk-ecs-ghost will not modify an imported VPC. By default, VPC Endpoints
     * are configured with the generated cdk-ecs-ghost VPC. If these are not included
     * in your own VPC, this may incur more cost
     */
    importSettings? : ImportVPCSettings
    

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
     * ECS Cluster Settings
     */
    ecsSettings: ECSSettings

    /**
     * ALB Settings
     */
    albSettings: ALBSettings

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