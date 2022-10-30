export interface Settings {
    codeCommitRepositoryName: string
    codeCommitRepositoryBranch: string
    ssmECSClusterARNName: string,
    ssmECSClusterNameName: string,
    ssmECSClusterVPCId: string,
    ssmECSClusterVPCSGId: string,
    ssmECSLoadBalancerListenerArn: string
    ssmECSTaskExecutionRoleArn: string
}