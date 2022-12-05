import { CfnOutput, Stack } from "aws-cdk-lib";
import { IVpc, SecurityGroup, Vpc } from "aws-cdk-lib/aws-ec2";
import { Cluster, ICluster } from "aws-cdk-lib/aws-ecs";
import { ParameterTier, StringParameter } from "aws-cdk-lib/aws-ssm";
import { Construct } from "constructs";
import { ConfigurationSingletonFactory } from "../conf/configuration-singleton-factory";

export interface ECSConstructProps {
    vpc: IVpc,
    clusterName?: string
}

export class ECSConstruct extends Construct {

    public readonly cluster: ICluster

    constructor(scope: Construct, id: string, props: ECSConstructProps){
        super(scope, id)

        const configuration = ConfigurationSingletonFactory.getInstance(Stack.of(this).account, Stack.of(this).region).getSettings()
        const prefix = configuration.prefixName

        if(configuration.ecsSettings.importSettings){
            this.cluster = Cluster.fromClusterAttributes(this, 'Cluster-Lookup', {
                clusterName: configuration.ecsSettings.importSettings.clusterName,
                clusterArn: configuration.ecsSettings.importSettings.clusterArn,
                vpc: Vpc.fromLookup(this, 'VPC-Lookup', {
                    vpcId: configuration.ecsSettings.importSettings.vpcId
                }),
                securityGroups: configuration.ecsSettings.importSettings.securityGroupIds.map((item) => SecurityGroup.fromLookupById(this, `SecurityGroup-Lookup-${item}`, item))
            })
        }else{
            this.cluster = new Cluster(this, 'Cluster', {
                clusterName: props.clusterName,
                vpc: props.vpc,
            })
        }

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