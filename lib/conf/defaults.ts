import { Duration } from "aws-cdk-lib"
import { SslPolicy } from "aws-cdk-lib/aws-elasticloadbalancingv2"
import { ISettings } from "./isettings"
import { Settings } from "./settings"

export class Defaults implements ISettings<Settings> {

    private readonly settings:Settings = {
        domainName: 'localhost',
        databaseName: 'ghost_blog',
        prefixName: '',
        
        healthCheck: {
            interval: Duration.minutes(2),
            healthyThresholdCount: 5,
            unhealthyThresholdCount: 5,
            timeout: Duration.seconds(45),
            healthCheckGracePeriod: Duration.minutes(15)
        },

        vpcSettings: {
            vpcCIDRRange: '20.0.0.0/16',
            numberOfNatGateways: 1,
            enableServiceEndpoints: true
        },

        ecsSettings: {
            loggingPrefix: 'ghostblog-container',

        },

        albSettings: {
            sslPolicy: SslPolicy.RECOMMENDED,
            stickyCookieName: 'ghostblog-sticky-cookie',
        }
        
    }

    public getSettings(): Settings {
        return this.settings
    }
}