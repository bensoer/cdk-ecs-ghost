import { CfnOutput } from "aws-cdk-lib";
import { IRole, ManagedPolicy, PolicyStatement, Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { IBucket } from "aws-cdk-lib/aws-s3";
import { ParameterTier, StringParameter } from "aws-cdk-lib/aws-ssm";
import { Construct } from "constructs";
import { ConfigurationSingletonFactory } from "../conf/configuration-singleton-factory";

export interface IAMConstructProps {
    assetBucket: IBucket
}

export class IAMConstruct extends Construct {

    public readonly taskExecutionRole: IRole
    public readonly containerExecutionRole: Role
    
    constructor(scope: Construct, id:string, props: IAMConstructProps){
        super(scope, id)

        const configuration = ConfigurationSingletonFactory.getInstance().getSettings()
        const prefix = configuration.prefixName

        // ECS Execution Role ================================================

        this.taskExecutionRole = new Role(this, 'ECSTaskExecutionRole', {
            roleName: prefix + 'ECSTaskExecutionRole',
            description: (prefix + ' ECS Task Execution Role').trim(),
            assumedBy: new ServicePrincipal('ecs-tasks.amazonaws.com'),
            managedPolicies: [
                ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy'),
                //iam.ManagedPolicy.fromAwsManagedPolicyName('aws-service-role/AmazonECSServiceRolePolicy')
            ],
        })
    
        new StringParameter(this, `SSMECSTaskExecuctionRole`, {
            parameterName: prefix ? '/' + prefix + `/iam/ecstaskexecutionrole/arn` : `/iam/ecstaskexecutionrole/arn`,
            description: `ECSTaskExecutionRole ARN`,
            stringValue: this.taskExecutionRole.roleArn,
            tier: ParameterTier.STANDARD
        })
      
        new CfnOutput(this, `Output-SSMECSTaskExecuctionRole`, {
            value: this.taskExecutionRole.roleArn,
            description: `ECSTaskExecutionRole ARN`,
        })

        // Container Service Role ==============================================

        this.containerExecutionRole = new Role(this, 'ContainerServiceRole', {
            roleName: prefix + 'ContainerServiceRole',
            description: (prefix + ' Service Role Assumed By Container To Access AWS').trim(),
            assumedBy: new ServicePrincipal('ecs-tasks.amazonaws.com')
        })
    
        this.containerExecutionRole.addToPolicy(new PolicyStatement({
            actions: [
                "s3:ListBucket",
                "s3:PutObject",
                "s3:GetObject",
                "s3:PutObjectVersionAcl",
                "s3:DeleteObject",
                "s3:PutObjectAcl"
            ],
            resources: [
                props.assetBucket.bucketArn,
                props.assetBucket.arnForObjects('*')
            ]
        }))

        new StringParameter(this, `SSMECSContainerExecuctionRole`, {
            parameterName: prefix ? '/' + prefix + `/iam/ecscontainerexecutionrole/arn` : `/iam/ecscontainerexecutionrole/arn`,
            description: `ECSContainerExecutionRole ARN`,
            stringValue: this.containerExecutionRole.roleArn,
            tier: ParameterTier.STANDARD
        })
      
        new CfnOutput(this, `Output-SSMECSContainerExecuctionRole`, {
            value: this.containerExecutionRole.roleArn,
            description: `ECSContainerExecutionRole ARN`,
        })
    }
}