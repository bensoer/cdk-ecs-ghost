import { CfnOutput } from "aws-cdk-lib";
import { ILoadBalancerV2 } from "aws-cdk-lib/aws-elasticloadbalancingv2";
import { ARecord, CnameRecord, PublicHostedZone, RecordTarget } from "aws-cdk-lib/aws-route53";
import { LoadBalancerTarget } from "aws-cdk-lib/aws-route53-targets";
import { ParameterTier, StringParameter } from "aws-cdk-lib/aws-ssm";
import { Construct } from "constructs";
import { ConfigurationSingletonFactory } from "../conf/configuration-singleton-factory";

export interface Route53ConstructProps {
    loadBalancer: ILoadBalancerV2,
    domainName: string
}

export class Route53Construct extends Construct {

    public readonly publicHostedZone: PublicHostedZone
    public readonly adminDomainName: string
    public readonly domainName: string
    public readonly hostedZoneDomainMap = new Map<PublicHostedZone, Array<string>>()

    constructor(scope: Construct, id: string, props: Route53ConstructProps){
        super(scope, id)

        

        this.domainName = props.domainName
        this.adminDomainName = `admin.${this.domainName}`

        this.publicHostedZone = new PublicHostedZone(this, 'PublicHostedZone', {
            zoneName: this.domainName
        })

        // Resolve the domain name root to the load balancer
        new ARecord(this, this.domainName, {
            zone: this.publicHostedZone,
            target: RecordTarget.fromAlias(new LoadBalancerTarget(props.loadBalancer))
        })

        new CnameRecord(this, `www.${this.domainName}`, {
            zone: this.publicHostedZone,
            recordName: 'www',
            domainName: this.domainName
        })

        // Resolve also the admin page domain to the load balancer
        new ARecord(this, this.adminDomainName, {
            zone: this.publicHostedZone,
            recordName: 'admin',
            target: RecordTarget.fromAlias(new LoadBalancerTarget(props.loadBalancer))
        })
        new CnameRecord(this, `www.${this.adminDomainName}`, {
            zone: this.publicHostedZone,
            recordName: 'www.admin',
            domainName: this.adminDomainName
        })

        this.hostedZoneDomainMap.set(this.publicHostedZone, [ this.domainName, this.adminDomainName ])

        this.createSSMAndOutputOutOfZone(this.publicHostedZone)
    }

    private createSSMAndOutputOutOfZone(zone: PublicHostedZone){

        const configuration = ConfigurationSingletonFactory.getInstance().getSettings()
        const prefix = configuration.prefixName

        new StringParameter(this, `route53-${zone.zoneName}-id`, {
          parameterName: prefix ? '/' + prefix + `/route53/${zone.zoneName}/id` : `/route53/${zone.zoneName}/id`,
          description: `${zone.zoneName} ID`,
          stringValue: zone.hostedZoneId,
          tier: ParameterTier.STANDARD
        })
    
        new CfnOutput(this, `Output-route53-${zone.zoneName}-id`, {
          value: zone.hostedZoneId,
          description: `${zone.zoneName} ID`,
        })
    
        new StringParameter(this, `route53-${zone.zoneName}-arn`, {
          parameterName: prefix ? '/' + prefix + `/route53/${zone.zoneName}/arn` : `/route53/${zone.zoneName}/arn`,
          description: `${zone.zoneName} ARN`,
          stringValue: zone.hostedZoneArn,
          tier: ParameterTier.STANDARD
        })
    
        new CfnOutput(this, `Output-route53-${zone.zoneName}-arn`, {
          value: zone.hostedZoneArn,
          description: `${zone.zoneName} Arn`,
        })
    
      }
}