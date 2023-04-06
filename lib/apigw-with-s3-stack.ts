import * as cdk from 'aws-cdk-lib';
import * as apigatewayv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as s3 from "aws-cdk-lib/aws-s3";
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export class ApiGatewayWithS3Stack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const apigBucket = new s3.Bucket(this, 'APIGatewayBucket', {
            bucketName: `sujie-poc-apigw-with-s3-${cdk.Stack.of(this).region}`,
            accessControl: s3.BucketAccessControl.PRIVATE,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            autoDeleteObjects: true,
        });

        const serviceProxyApi = new apigatewayv2.CfnApi(this, 'AWSServiceProxyAPI', {
            name: 'SuJie-AWSServiceProxyAPI',
            protocolType: 'WEBSOCKET',
            routeSelectionExpression: '$request.body.action',
        });

        const s3AssumeRole = new iam.Role(this, 'APIGatewayS3AssumeRole', {
            roleName: `SuJie-APIGatewayS3AssumeRole-${cdk.Stack.of(this).region}`,
            assumedBy: new iam.ServicePrincipal('apigateway.amazonaws.com'),
            managedPolicies: [
                iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3ReadOnlyAccess')
            ],
        });

        // 创建可以直接和S3服务交互的Integration
        // 这里创建出的Integration对应Web Console中route的"Integration Request"页面设置
        // 下面第一行 s3IntegrationUri 的写法会把"Integration Request"页面中的"Action Type"设置为"Use path override"
        // 第二行 s3IntegrationUri 的写法会把"Integration Request"页面中的"Action Type"设置为"Use action name"
        //const s3IntegrationUri = `arn:aws:apigateway:${cdk.Stack.of(this).region}:s3:path/${apigBucket.bucketName}`;
        const s3IntegrationUri = `arn:aws:apigateway:${cdk.Stack.of(this).region}:s3:action/ListBuckets`;
        const s3Integration = new apigatewayv2.CfnIntegration(this, 'S3Integration', {
            apiId: serviceProxyApi.ref,
            integrationType: 'AWS',
            integrationMethod: 'GET',
            credentialsArn: s3AssumeRole.roleArn,
            integrationUri: s3IntegrationUri,
        });
        
        const getObjectRoute = new apigatewayv2.CfnRoute(this, 'GetObjectRoute', {
            apiId: serviceProxyApi.ref,
            routeKey: 'getobject',
            authorizationType: 'NONE',
            target: 'integrations/' + s3Integration.ref,
        });

        const s3RouteResponse = new apigatewayv2.CfnRouteResponse(this, 'S3RouteResponse', {
            apiId: serviceProxyApi.ref,
            routeId: getObjectRoute.ref,
            routeResponseKey: '$default'
        });

        const s3IntegrationResponse = new apigatewayv2.CfnIntegrationResponse(this, 'S3IntegrationResponse', {
            apiId: serviceProxyApi.ref,
            integrationId: s3Integration.ref,
            integrationResponseKey: '$default'
        });

        const devDeployment = new apigatewayv2.CfnDeployment(this, 'DevDeployment', {
            apiId: serviceProxyApi.ref,
        });
        devDeployment.node.addDependency(getObjectRoute);
        const devStage = new apigatewayv2.CfnStage(this, 'DevStage', {
            apiId: serviceProxyApi.ref,
            autoDeploy: true,
            deploymentId: devDeployment.ref,
            stageName: 'dev'
        });
    }
}
