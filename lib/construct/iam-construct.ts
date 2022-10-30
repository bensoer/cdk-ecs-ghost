import { CfnOutput } from "aws-cdk-lib";
import { IRole, ManagedPolicy, PolicyStatement, Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { IBucket } from "aws-cdk-lib/aws-s3";
import { ParameterTier, StringParameter } from "aws-cdk-lib/aws-ssm";
import { Construct } from "constructs";

export interface IAMConstructProps {
    assetBucket: IBucket
}

export class IAMConstruct extends Construct {

    public readonly taskExecutionRole: IRole
    public readonly containerExecutionRole: Role
    
    constructor(scope: Construct, id:string, props: IAMConstructProps){
        super(scope, id)

        // ECS Execution Role ================================================

        this.taskExecutionRole = new Role(this, 'ECSTaskExecutionRole', {
            roleName: 'ECSTaskExecutionRole',
            description: 'ECS Task Execution Role',
            assumedBy: new ServicePrincipal('ecs-tasks.amazonaws.com'),
            managedPolicies: [
                ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy'),
                //iam.ManagedPolicy.fromAwsManagedPolicyName('aws-service-role/AmazonECSServiceRolePolicy')
            ],
        })
    
        new StringParameter(this, `SSMECSTaskExecuctionRole`, {
            parameterName: `/iam/ecstaskexecutionrole/arn`,
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
            roleName: 'ContainerServiceRole',
            description: 'Service Role Assumed By Container To Access AWS',
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
            parameterName: `/iam/ecscontainerexecutionrole/arn`,
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