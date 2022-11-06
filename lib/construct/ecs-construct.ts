import { CfnOutput } from "aws-cdk-lib";
import { IVpc } from "aws-cdk-lib/aws-ec2";
import { Cluster } from "aws-cdk-lib/aws-ecs";
import { ParameterTier, StringParameter } from "aws-cdk-lib/aws-ssm";
import { Construct } from "constructs";
import { ConfigurationSingletonFactory } from "../conf/configuration-singleton-factory";

export interface ECSConstructProps {
    vpc: IVpc,
    clusterName?: string
}

export class ECSConstruct extends Construct {

    public readonly cluster: Cluster

    constructor(scope: Construct, id: string, props: ECSConstructProps){
        super(scope, id)

        const configuration = ConfigurationSingletonFactory.getInstance().getSettings()
        const prefix = configuration.prefixName

        this.cluster = new Cluster(this, 'Cluster', {
            clusterName: props.clusterName,
            vpc: props.vpc,
        })

        // ECS Cluster Parameters
        new StringParameter(this, 'ECSClusterARN', {
            parameterName: prefix ? '/' + prefix + '/ecs/cluster/arn' : '/ecs/cluster/arn',
            description: 'ECS Cluster ARN',
            stringValue: this.cluster.clusterArn,
            tier: ParameterTier.STANDARD
        })
        new StringParameter(this, 'ECSClusterName', {
            parameterName: prefix ? '/' + prefix + '/ecs/cluster/name' : '/ecs/cluster/name',
            description: 'ECS Cluster Name',
            stringValue: this.cluster.clusterName,
            tier: ParameterTier.STANDARD
        })

        // Cluster Outputs
        new CfnOutput(this, 'Output-ECSClusterName', {
            value: this.cluster.clusterName,
            description: 'ECS Cluster Name'
          })
        new CfnOutput(this, 'Output-ECSClusterARN', {
            value: this.cluster.clusterArn,
            description: 'ECS Cluster ARN',
        })
    }
}