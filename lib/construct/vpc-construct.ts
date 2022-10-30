import { CfnOutput } from "aws-cdk-lib";
import { GatewayVpcEndpointAwsService, InterfaceVpcEndpointAwsService, ISecurityGroup, IVpc, SecurityGroup, Vpc } from "aws-cdk-lib/aws-ec2";
import { ParameterTier, StringParameter } from "aws-cdk-lib/aws-ssm";
import { Construct } from "constructs";


export class VPCConstruct extends Construct {

    public readonly vpc: IVpc
    public readonly securityGroup: ISecurityGroup

    constructor(scope: Construct, id: string){
        super(scope, id)

        this.vpc = new Vpc(this, 'CommonVPC', {
            cidr: '20.0.0.0/16',
            natGateways: 1,

            // auto dns resolution for endpoint stuff
            enableDnsHostnames: true,
            enableDnsSupport: true
        })

        this.vpc.addGatewayEndpoint('CommonVPCS3Endpoint', {
            service: GatewayVpcEndpointAwsService.S3
        })

        this.vpc.addInterfaceEndpoint('CommonVPCECRDockerEndpoint', {
            service: InterfaceVpcEndpointAwsService.ECR_DOCKER
        })

        this.vpc.addInterfaceEndpoint('CommonVPCECREndpoint', {
            service: InterfaceVpcEndpointAwsService.ECR
        })

        this.vpc.addInterfaceEndpoint('CommonVPCSecretsManagerEndpoint', {
            service: InterfaceVpcEndpointAwsService.SECRETS_MANAGER
        })

        this.vpc.addInterfaceEndpoint('CommonVPCCloudWatchEndpoint', {
            service: InterfaceVpcEndpointAwsService.CLOUDWATCH_LOGS
        })

        this.securityGroup = new SecurityGroup(this, 'CommonVPCSecurityGroup', {
            vpc: this.vpc,
            description: 'CommonVPC Security Group',
            allowAllOutbound: true
        })

        // ECS VPC SG
        new StringParameter(this, 'CommonVPCSecurityGroupID', {
            parameterName: '/vpc/sg/id',
            description: 'The Common VPC Security Group',
            stringValue: this.securityGroup.securityGroupId,
            tier: ParameterTier.STANDARD
        })

        // ECS VPC Parameters
        new StringParameter(this, 'CommonVPCCIDR', {
            parameterName: '/vpc/cidr',
            description: 'The Common VPC CIDR',
            stringValue: this.vpc.vpcCidrBlock,
            tier: ParameterTier.STANDARD
        })

        new StringParameter(this, 'CommonVPCID', {
            parameterName: '/vpc/id',
            description: 'The Common VPC ID',
            stringValue: this.vpc.vpcId
        })

        new CfnOutput(this, 'Output-CommonVPCCIDR', {
            value: this.vpc.vpcCidrBlock,
            description: 'The Common VPC CIDR',
        })
        new CfnOutput(this, 'Output-CommonVPCID', {
            value: this.vpc.vpcId,
            description: 'The Common VPC ID',
        })

        new CfnOutput(this, 'Output-CommonVPCSecurityGroupID', {
            value: this.securityGroup.securityGroupId,
            description: 'The Common VPC Security Group',
        })
    }
}