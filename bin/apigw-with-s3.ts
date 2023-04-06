#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ApiGatewayWithS3Stack } from '../lib/apigw-with-s3-stack';

const app = new cdk.App();
new ApiGatewayWithS3Stack(app, 'SuJie-ApiGatewayWithS3', {
    env: { 
        account: process.env.CDK_DEPLOY_ACCOUNT || process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEPLOY_REGION || process.env.CDK_DEFAULT_REGION
    }
});
