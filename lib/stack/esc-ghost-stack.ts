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
import { ApplicationListener, ApplicationProtocol, ApplicationProtocolVersion, ApplicationTargetGroup, ListenerCondition, TargetType } from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { ACMConstruct } from '../construct/acm-construct';

export class ECSGhostStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        // Create the VPC where everything will be located in
        const vpcConstruct = new VPCConstruct(this, 'GhostVPC')

        // Create the ECS Cluster
        const ecsConstruct = new ECSConstruct(this, 'GhostECSCluster', {
          vpc: vpcConstruct.vpc
        })

        // Render the Dockerfile into an ECR image
        const ghostBlogImage = new DockerImageAsset(this, 'GhostBlogImage', {
          directory: path.join(__dirname, '../../res/docker'),
        })

        // Create Asset Bucket And Permissions
        const s3Construct = new S3Construct(this, 'GhostBlogAssets', {} )

        // Create Roles For ECS Cluster and Container
        const iamConstruct = new IAMConstruct(this, 'GhostBlogIAM', {
          assetBucket: s3Construct.bucket
        })

        // Grant taskExeuctionRole ability to pull our ECR image
        const taskExecutionRole = iamConstruct.taskExecutionRole
        ghostBlogImage.repository.grantPull(taskExecutionRole)

        // Create the Database for Ghost to work in
        const rdsConstrust = new RDSConstruct(this, 'GhostBlogDatabase' , {
          vpc: vpcConstruct.vpc
        })

        // Create the ALB
        const albConstruct = new ALBConstruct(this, 'GhostBlogALB', {
          vpc: vpcConstruct.vpc,
          vpcSecurityGroup: vpcConstruct.securityGroup
        })

        // Create the domains
        const route53Construct = new Route53Construct(this, 'GhostBlogDNS', {
          loadBalancer: albConstruct.alb,
          domainName: ''
        })

        // Create the Certificates
        const acmConstruct = new ACMConstruct(this, 'GhostBlogSSL', {
          hostedZoneDomainMap: route53Construct.hostedZoneDomainMap
        })

        // Get the Database Credentials
        const dbAdminPasswordSecret = rdsConstrust.databaseInstance.secret!

        // ============== Actual Container and Service Configuration ====================

        // Create Task Definition
        const taskDefinition = new ecs.FargateTaskDefinition(this, 'GhostBlogTaskDefinition', {
          executionRole: iamConstruct.taskExecutionRole,
          taskRole: iamConstruct.containerExecutionRole,
          memoryLimitMiB: 1024
        })

        // Create Container
        const container = taskDefinition.addContainer('GhostBlogContainer', {
          containerName: 'ghostblog-container',
          image: ecs.ContainerImage.fromDockerImageAsset(ghostBlogImage),
          //image: ecs.ContainerImage.fromTarball(path.join(__dirname, '../../res/docker/personalblog_ghost_container.tar')),
          environment: {
              NODE_ENV: 'production',
              "admin__url": `https://${route53Construct.adminDomainName}`,
              "url": `https://${route53Construct.domainName}`,
              "database__client": "mysql",
              "database__connection__database": "ghost_personalblog",
              "database__connection__ssl": "Amazon RDS",
              "adapters__storage__active": "s3",
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
              "database__connection__port": ecs.Secret.fromSecretsManager(dbAdminPasswordSecret, 'port')
          },
          logging: ecs.LogDrivers.awsLogs({ streamPrefix: 'ghostblog-container'}),
          portMappings: [ {containerPort: 2368, protocol: ecs.Protocol.TCP }],
          memoryLimitMiB: 1024,
          memoryReservationMiB: 512
      })
      container.node.addDependency(ghostBlogImage)

      // Create the Service
      const service = new ecs.FargateService(this, 'GhostBlogService', {
        serviceName: 'ghostblog-service',
        cluster: ecsConstruct.cluster,
        taskDefinition: taskDefinition,

        // deployment related settings
        desiredCount: 1,
        circuitBreaker: {
            rollback: true
        },
        deploymentController: {
            type: ecs.DeploymentControllerType.ECS
        },
        healthCheckGracePeriod: Duration.minutes(5),

        //tagging settings
        enableECSManagedTags: true,

      })

      // Create target group
      const targetGroup = new ApplicationTargetGroup(this, 'GhostBlogTargetGroup', {
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
        },
        stickinessCookieDuration: Duration.days(1),
        stickinessCookieName: 'ghostblog-sticky-cookie'
      })

      albConstruct.defaultSecureListener.addTargetGroups('GhostBlogRouteMapping', {
        targetGroups: [
            targetGroup
        ],
        conditions: [
            ListenerCondition.hostHeaders([route53Construct.domainName])
        ],
        priority: 5,
      })

      albConstruct.defaultSecureListener.addTargetGroups('GhostBlogAdminRouteMapping', {
          targetGroups: [
              targetGroup
          ],
          conditions: [
              ListenerCondition.hostHeaders([route53Construct.adminDomainName])
          ],
          priority: 6
      })

    Tags.of(this).add('Project', 'ghostblog')
  }
}
