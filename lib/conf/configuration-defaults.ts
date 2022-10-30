import { AbstractConfiguration } from "./abstract-configuration"
import { Settings } from "./settings"

export class ConfigurationDefaults extends AbstractConfiguration {

    private readonly settings:Settings = {
        codeCommitRepositoryBranch: "master",
        codeCommitRepositoryName: "personalblog",
        ssmECSClusterARNName: "/ecs/cluster/arn",
        ssmECSClusterNameName: '/ecs/cluster/name',
        ssmECSClusterVPCId: '/ecs/vpc/id',
        ssmECSClusterVPCSGId: '/ecs/vpc/sg/id',
        ssmECSLoadBalancerListenerArn: '/ecs/alb/ssllistener/arn',
        ssmECSTaskExecutionRoleArn: '/iam/ecstaskexecutionrole/arn'
    }

    public getSettings(): Settings {
        return this.settings
    }
}