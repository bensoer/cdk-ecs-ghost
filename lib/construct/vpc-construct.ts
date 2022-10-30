import { CfnOutput } from "aws-cdk-lib";
import { GatewayVpcEndpointAwsService, InterfaceVpcEndpointAwsService, ISecurityGroup, IVpc, SecurityGroup, Vpc } from "aws-cdk-lib/aws-ec2";
import { ParameterTier, StringParameter } from "aws-cdk-lib/aws-ssm";
import { Construct } from "constructs";


export class VPCConstruct extends Construct {

    public readonly vpc: IVpc
    public readonly securityGroup: ISecurityGroup

    constructor(scope: Construct, id: string){
        super(scope, id)

        this.vpc = new Vpc(this, 'VPC', {
            cidr: '20.0.0.0/16',
            natGateways: 1,

            // auto dns resolution for endpoint stuff
            enableDnsHostnames: true,
            enableDnsSupport: true
        })

        this.vpc.addGatewayEndpoint('S3Endpoint', {
            service: GatewayVpcEndpointAwsService.S3
        })

        this.vpc.addInterfaceEndpoint('ECRDockerEndpoint', {
            service: InterfaceVpcEndpointAwsService.ECR_DOCKER
        })

        this.vpc.addInterfaceEndpoint('ECREndpoint', {
            service: InterfaceVpcEndpointAwsService.ECR
        })

        this.vpc.addInterfaceEndpoint('SecretsManagerEndpoint', {
            service: InterfaceVpcEndpointAwsService.SECRETS_MANAGER
        })

        this.vpc.addInterfaceEndpoint('CloudWatchEndpoint', {
            service: InterfaceVpcEndpointAwsService.CLOUDWATCH_LOGS
        })

        this.securityGroup = new SecurityGroup(this, 'VPCSecurityGroup', {
            vpc: this.vpc,
            description: 'VPC Security Group',
            allowAllOutbound: true
        })

        // ECS VPC SG
        new StringParameter(this, 'VPCSecurityGroupID', {
            parameterName: '/vpc/sg/id',
            description: 'The Common VPC Security Group',
            stringValue: this.securityGroup.securityGroupId,
            tier: ParameterTier.STANDARD
        })

        // ECS VPC Parameters
        new StringParameter(this, 'VPCCIDR', {
            parameterName: '/vpc/cidr',
            description: 'The VPC CIDR',
            stringValue: this.vpc.vpcCidrBlock,
            tier: ParameterTier.STANDARD
        })

        new StringParameter(this, 'VPCID', {
            parameterName: '/vpc/id',
            description: 'The VPC ID',
            stringValue: this.vpc.vpcId
        })

        new CfnOutput(this, 'Output-VPCCIDR', {
            value: this.vpc.vpcCidrBlock,
            description: 'The VPC CIDR',
        })
        new CfnOutput(this, 'Output-VPCID', {
            value: this.vpc.vpcId,
            description: 'The VPC ID',
        })

        new CfnOutput(this, 'Output-VPCSecurityGroupID', {
            value: this.securityGroup.securityGroupId,
            description: 'The VPC Security Group',
        })
    }
}