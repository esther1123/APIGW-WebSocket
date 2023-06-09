#!/bin/bash

SHELL_PATH=$(cd "$(dirname "$0")";pwd)

AWS_ACCOUNT="$(aws sts get-caller-identity --output text --query 'Account')"
DEPLOYMENT_REGION="ap-northeast-1"
if [ -z "$DEPLOYMENT_REGION" ]; then
    DEPLOYMENT_REGION="$(aws configure get region)"
fi

# npx cdk bootstrap aws://${AWS_ACCOUNT}/${DEPLOYMENT_REGION}

CDK_DEPLOYMENT_OUTPUT_FILE="${SHELL_PATH}/cdk.out/deployment-output.json"

export CDK_DEPLOY_ACCOUNT=${AWS_ACCOUNT}
export CDK_DEPLOY_REGION=${DEPLOYMENT_REGION}
set -- "$@" "-c" "deploymentStage=DEV" "--outputs-file" "$CDK_DEPLOYMENT_OUTPUT_FILE"
npx cdk "$@"

# CDK command post-process.
if [ "$CDK_CMD" == "destroy" ]; then
    rm -rf $CDK_DEPLOYMENT_OUTPUT_FILE
fi
