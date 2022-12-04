import * as cdk from 'aws-cdk-lib';
import { DockerImageAsset } from 'aws-cdk-lib/aws-ecr-assets';
import { Construct } from 'constructs';
import { ECSConstruct } from '../construct/ecs-construct';
import { VPCConstruct } from '../construct/vpc-construct';
import * as path from 'path'
import { S3Construct } from '../construct/s3-construct';
import { IAMConstruct } from '../construct/iam-construct';
import { RDSConstruct } from '../construct/rds-construct';
import *  as ecs from 'aws-cdk-lib/aws-ecs';
import { Route53Construct } from '../construct/route53-construct';
import { ALBConstruct } from '../construct/alb-construct';
import { Duration, Tags } from 'aws-cdk-lib';
import { ApplicationProtocol, ApplicationProtocolVersion, ApplicationTargetGroup, ListenerAction, ListenerCondition, TargetType } from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { ACMConstruct } from '../construct/acm-construct';
import { ConfigurationSingletonFactory } from '../conf/configuration-singleton-factory';

export class ECSGhostStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const configuration = ConfigurationSingletonFactory.getInstance().getSettings()
        const prefix = configuration.prefixName

        // Create the VPC where everything will be located in
        const vpcConstruct = new VPCConstruct(this, prefix + 'GhostVPC')

        // Create the ECS Cluster
        const ecsConstruct = new ECSConstruct(this, prefix + 'GhostECSCluster', {
          vpc: vpcConstruct.vpc,
          clusterName: configuration.ecsSettings.clusterName
        })

        // Render the Dockerfile into an ECR image
        const ghostBlogImage = new DockerImageAsset(this, prefix + 'GhostBlogImage', {
          directory: path.join(__dirname, '../../res/docker'),
        })

        // Create Asset Bucket And Permissions
        const s3Construct = new S3Construct(this, prefix + 'GhostBlogAssets', {
          bucketName: configuration.assetBucketName
        })

        // Create Roles For ECS Cluster and Container
        const iamConstruct = new IAMConstruct(this, prefix + 'GhostBlogIAM', {
          assetBucket: s3Construct.bucket
        })

        // Grant taskExeuctionRole ability to pull our ECR image
        const taskExecutionRole = iamConstruct.taskExecutionRole
        ghostBlogImage.repository.grantPull(taskExecutionRole)

        // Create the Database for Ghost to work in
        const rdsConstrust = new RDSConstruct(this, prefix + 'GhostBlogDatabase' , {
          vpc: vpcConstruct.vpc
        })

        // Create the ALB
        const albConstruct = new ALBConstruct(this, prefix + 'GhostBlogALB', {
          vpc: vpcConstruct.vpc,
          vpcSecurityGroup: vpcConstruct.securityGroup
        })

        // Create the domains
        const route53Construct = new Route53Construct(this, prefix + 'GhostBlogDNS', {
          loadBalancer: albConstruct.alb,
          domainName: configuration.domainName
        })

        // Create the Certificates
        const acmConstruct = new ACMConstruct(this, prefix + 'GhostBlogSSL', {
          hostedZoneDomainMap: route53Construct.hostedZoneDomainMap
        })

        // Get the Database Credentials
        const dbAdminPasswordSecret = rdsConstrust.databaseInstance.secret!

        // ============== Actual Container and Service Configuration ====================

        // Create Task Definition
        const taskDefinition = new ecs.FargateTaskDefinition(this, prefix + 'GhostBlogTaskDefinition', {
          executionRole: iamConstruct.taskExecutionRole,
          taskRole: iamConstruct.containerExecutionRole,
          memoryLimitMiB: 1024
        })

        // Create Container
        const container = taskDefinition.addContainer(prefix + 'GhostBlogContainer', {
          containerName: configuration.ecsSettings.ghostBlogContainerName,
          image: ecs.ContainerImage.fromDockerImageAsset(ghostBlogImage),
          environment: {
              NODE_ENV: 'production',
              "admin__url": `https://${route53Construct.adminDomainName}`,
              "url": `https://${route53Construct.domainName}`,
              "database__client": "mysql",
              "database__connection__database": configuration.databaseName,
              "database__connection__ssl": "Amazon RDS",
              "adapters__storage__active": "s3",
              "adapters__storage__region": "us-east-1",
              "GHOST_STORAGE_ADAPTER_S3_PATH_BUCKET": s3Construct.bucket.bucketName,
              "GHOST_STORAGE_ADAPTER_S3_PATH_PREFIX": "content/images",
              //"mail__transport": "SMTP",
              //"mail__options__service": "Sendgrid",
              //"mail__options__host": "smtp.sendgrid.net",
              //"mail__options__port": "587",
          },
          secrets: {
              //"mail__options__auth__user": ecs.Secret.fromSecretsManager(sendgridCredentials, 'apikey'),
              //"mail__options__auth__pass": ecs.Secret.fromSecretsManager(sendgridCredentials,  'password'),

              "database__connection__password": ecs.Secret.fromSecretsManager(dbAdminPasswordSecret, 'password'),
              "database__connection__host": ecs.Secret.fromSecretsManager(dbAdminPasswordSecret, 'host'),
              "database__connection__user": ecs.Secret.fromSecretsManager(dbAdminPasswordSecret, 'username'),
              "database__connection__port": ecs.Secret.fromSecretsManager(dbAdminPasswordSecret, 'port'),


          },
          logging: ecs.LogDrivers.awsLogs({ streamPrefix: configuration.ecsSettings.loggingPrefix }),
          portMappings: [ {containerPort: 2368, protocol: ecs.Protocol.TCP }],
          memoryLimitMiB: 1024,
          memoryReservationMiB: 512
      })
      container.node.addDependency(ghostBlogImage)

      // Create the Service
      const service = new ecs.FargateService(this, prefix + 'GhostBlogService', {
        serviceName: configuration.ecsSettings.ghostBlogServiceName,
        cluster: ecsConstruct.cluster,
        taskDefinition: taskDefinition,

        // deployment related settings
        desiredCount: 1,
        /*circuitBreaker: {
            rollback: true
        },*/
        deploymentController: {
            type: ecs.DeploymentControllerType.ECS
        },
        healthCheckGracePeriod: configuration.healthCheck.healthCheckGracePeriod,

        //tagging settings
        enableECSManagedTags: true,

      })

      // Create target group
      const targetGroup = new ApplicationTargetGroup(this, prefix + 'GhostBlogTargetGroup', {
        targetType: TargetType.IP,
        vpc: vpcConstruct.vpc,
        port: 2368,
        protocol: ApplicationProtocol.HTTP,
        protocolVersion: ApplicationProtocolVersion.HTTP1,
        targets: [
            service
        ],
        healthCheck : {
            enabled: true,
            port: '2368',
            healthyHttpCodes: '200,301', // 301 is from the HTTP redirect to HTTPS by Ghost
            interval: configuration.healthCheck.interval,
            healthyThresholdCount: configuration.healthCheck.healthyThresholdCount,
            unhealthyThresholdCount: configuration.healthCheck.unhealthyThresholdCount,
            timeout: configuration.healthCheck.timeout
        },
        stickinessCookieDuration: Duration.days(1),
        stickinessCookieName: configuration.albSettings.stickyCookieName
      })

      albConstruct.defaultSecureListener.addAction(prefix + 'GhostBlogRouteMapping', {
        action: ListenerAction.forward([targetGroup]),
        conditions: [
          ListenerCondition.hostHeaders([route53Construct.domainName])
        ],
        priority: 500
      })

      albConstruct.defaultSecureListener.addAction(prefix + 'GhostBlogAdminRouteMapping', {
        action: ListenerAction.forward([targetGroup]),
        conditions: [
          ListenerCondition.hostHeaders([route53Construct.adminDomainName])
        ],
        priority: 600
      })

    
    Tags.of(this).add('Project', 'ecs-ghost-blog')
    Tags.of(this).add('Prefix', prefix)
    Tags.of(this).add('Domain', configuration.domainName)
  }
}
