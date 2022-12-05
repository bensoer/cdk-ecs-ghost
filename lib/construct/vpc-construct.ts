import { CfnOutput, Stack } from "aws-cdk-lib";
import { GatewayVpcEndpointAwsService, InterfaceVpcEndpointAwsService, ISecurityGroup, IVpc, SecurityGroup, Vpc } from "aws-cdk-lib/aws-ec2";
import { ParameterTier, StringParameter } from "aws-cdk-lib/aws-ssm";
import { Construct } from "constructs";
import { config } from "process";
import { ConfigurationSingletonFactory } from "../conf/configuration-singleton-factory";


export class VPCConstruct extends Construct {

    public readonly vpc: IVpc
    public readonly securityGroup: ISecurityGroup

    constructor(scope: Construct, id: string){
        super(scope, id)

        const configuration = ConfigurationSingletonFactory.getInstance(Stack.of(this).account, Stack.of(this).region).getSettings()
        const prefix = configuration.prefixName

        // Check whether importSettings were provided or if we are making our own
        if(configuration.vpcSettings.importSettings){
            this.vpc = Vpc.fromLookup(this, 'VPC-Lookup', {
                vpcId: configuration.vpcSettings.importSettings.vpcId
            })
            this.securityGroup = SecurityGroup.fromLookupById(this, 'VPCSecurityGroup-Lookup', configuration.vpcSettings.importSettings.securityGroupId)
        }else{
            this.vpc = new Vpc(this, 'VPC', {
                cidr: configuration.vpcSettings.vpcCIDRRange,
                natGateways: configuration.vpcSettings.numberOfNatGateways,
    
                // auto dns resolution for endpoint stuff
                enableDnsHostnames: true,
                enableDnsSupport: true
            })
    
            if(configuration.vpcSettings.enableServiceEndpoints){
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
            }

            this.securityGroup = new SecurityGroup(this, 'VPCSecurityGroup', {
                vpc: this.vpc,
                description: (prefix + ' VPC Security Group').trim(),
                allowAllOutbound: true
            })
        }
        

        // ECS VPC SG
        new StringParameter(this, 'VPCSecurityGroupID', {
            parameterName: prefix ? '/' + prefix + '/vpc/sg/id' : '/vpc/sg/id',
            description: 'The VPC Security Group',
            stringValue: this.securityGroup.securityGroupId,
            tier: ParameterTier.STANDARD
        })

        // ECS VPC Parameters
        new StringParameter(this, 'VPCCIDR', {
            parameterName: prefix ? '/' + prefix + '/vpc/cidr' : '/vpc/cidr',
            description: 'The VPC CIDR',
            stringValue: this.vpc.vpcCidrBlock,
            tier: ParameterTier.STANDARD
        })

        new StringParameter(this, 'VPCID', {
            parameterName: prefix ? '/' + prefix + '/vpc/id' : '/vpc/id',
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