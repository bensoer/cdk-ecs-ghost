import { CfnOutput } from "aws-cdk-lib";
import { InstanceClass, InstanceSize, InstanceType, IVpc, Peer, Port, SecurityGroup } from "aws-cdk-lib/aws-ec2";
import { Credentials, DatabaseInstance, DatabaseInstanceEngine } from "aws-cdk-lib/aws-rds";
import { ParameterTier, StringListParameter, StringParameter } from "aws-cdk-lib/aws-ssm";
import { Construct } from "constructs";
import { ConfigurationSingletonFactory } from "../conf/configuration-singleton-factory";

export interface RDSConstructProps {
    vpc: IVpc,
    securityGroupName?: string
}

export class RDSConstruct extends Construct {

    public readonly securityGroup: SecurityGroup
    public readonly databaseInstance: DatabaseInstance

    constructor(scope: Construct, id: string, props: RDSConstructProps){
        super(scope, id);

        const configuration = ConfigurationSingletonFactory.getInstance().getSettings()
        const prefix = configuration.prefixName
        
        this.securityGroup = new SecurityGroup(this, 'MySQLSecurityGroup', {
            securityGroupName: props.securityGroupName,
            description: (prefix + ' Security Group for access to MySQL Database').trim(),
            vpc: props.vpc,
            allowAllOutbound: true,
        })
        this.securityGroup.addIngressRule(Peer.ipv4(props.vpc.vpcCidrBlock), Port.tcp(3306), 'Allow MySQL Connections From Within the VPC')
        
        this.databaseInstance = new DatabaseInstance(this, 'MySQLInstance', {
            engine: DatabaseInstanceEngine.MYSQL,
            instanceType: InstanceType.of(InstanceClass.T3, InstanceSize.MICRO),
            credentials: Credentials.fromGeneratedSecret('dbAdmin', {
                excludeCharacters: ' %+~=,"!&*^#@()[]{}\\|;:<>/\'$.',
                secretName: 'dbAdminPasswordSecret'
            }),
            vpc: props.vpc,
            publiclyAccessible: false,
            securityGroups: [
                this.securityGroup
            ]
        })

        const address = this.databaseInstance.instanceEndpoint.socketAddress

        new StringParameter(this, `MySQLInstanceEndpoint`, {
            parameterName: prefix ? '/' + prefix + `/rds/mysql/endpoint` : `/rds/mysql/endpoint`,
            description: `Endpoint To Connect To MYSQL with`,
            stringValue: address,
            tier: ParameterTier.STANDARD
        })
      
        new CfnOutput(this, `Output-MySQLInstanceEndpoint`, {
            value: address,
            description: `Endpoint To Connect To MYSQL with`,
        })


        // A Custom resource that then does the 'CREATE DATABASE ghost;'
    }
}