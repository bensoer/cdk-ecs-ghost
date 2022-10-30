import { RemovalPolicy, Size, Stack } from "aws-cdk-lib";
import { AccountPrincipal, Effect, PolicyStatement } from "aws-cdk-lib/aws-iam";
import { BlockPublicAccess, Bucket, BucketEncryption, IBucket, ObjectOwnership } from "aws-cdk-lib/aws-s3";
import { BucketDeployment, Source } from "aws-cdk-lib/aws-s3-deployment";
import { Construct } from "constructs";
import * as path from 'path'

export interface S3ConstructProps {
    bucketName?: string
}

export class S3Construct extends Construct {

    public readonly bucket: IBucket

    constructor(scope: Construct, id:string, props: S3ConstructProps){
        super(scope, id)

        this.bucket = new Bucket(this, 'AssetBucket', {
            bucketName: props.bucketName,
            encryption: BucketEncryption.S3_MANAGED,
            enforceSSL: true,
            blockPublicAccess: BlockPublicAccess.BLOCK_ACLS,
            objectOwnership: ObjectOwnership.BUCKET_OWNER_ENFORCED,
            removalPolicy: RemovalPolicy.DESTROY,
            autoDeleteObjects: true
        })

        this.bucket.addToResourcePolicy(new PolicyStatement({
            principals: [
                new AccountPrincipal(Stack.of(this).account)
            ],
            effect: Effect.ALLOW,
            actions: [
                "s3:ListBucket",
                "s3:PutObject",
                "s3:GetObject",
                "s3:PutObjectVersionAcl",
                "s3:DeleteObject",
                "s3:PutObjectAcl"
            ],
            resources: [
                this.bucket.arnForObjects('*'),
                this.bucket.bucketArn
            ]
        }))

        const assetBucketDeployment = new BucketDeployment(this, 'AssetBucketDeployment', {
            memoryLimit: 2048,
            ephemeralStorageSize: Size.mebibytes(1024),
            sources: [
                Source.asset(path.join(__dirname, '../../res')),
            ],
            destinationBucket: this.bucket,
            prune: false,
            retainOnDelete: false
        })
        assetBucketDeployment.node.addDependency(this.bucket)
    }
}