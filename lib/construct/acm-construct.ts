import { CfnOutput } from "aws-cdk-lib";
import { Certificate, CertificateValidation } from "aws-cdk-lib/aws-certificatemanager";
import { HostedZone } from "aws-cdk-lib/aws-route53";
import { ParameterTier, StringParameter } from "aws-cdk-lib/aws-ssm";
import { Construct } from "constructs";

export interface ACMConstructProps {
    hostedZoneDomainMap: Map<HostedZone, Array<string>>
}

export class ACMConstruct extends Construct {

    public readonly certificates: Array<Certificate> = new Array<Certificate>()

    constructor(scope: Construct, id:string, props: ACMConstructProps){
        super(scope, id)

        for(const [hostedZone, domains] of props.hostedZoneDomainMap){
            for(const domain of domains){
                const certificate = new Certificate(this, `${domain}`, {
                    domainName: domain,
                    validation: CertificateValidation.fromDns(hostedZone)
                })
    
                new StringParameter(this, `SSM-ACM${domain}Certificate`, {
                    parameterName: `/acm/${domain}/arn`,
                    description: `${domain} Certificate ARN`,
                    stringValue: certificate.certificateArn,
                    tier: ParameterTier.STANDARD
                })
    
                new CfnOutput(this, `Output-ACM${domain}Certificate`, {
                    value: certificate.certificateArn,
                    description: `${domain} Certificate ARN`,
                })
    
                this.certificates.push(certificate)
            }   
        }


    }
}