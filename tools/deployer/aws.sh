#!/bin/bash
. ./get_environment_type.sh

get_environment_type $2

./create_inventory.sh

. ./get_env.sh

PROJECT_NAME=$(get_env "$BASH_SOURCE" "PROJECT_NAME")

ROOT_AWS_ACCESS_KEY_ID=$(get_env "$BASH_SOURCE" "ROOT_AWS_ACCESS_KEY_ID")
ROOT_AWS_SECRET_ACCESS_KEY=$(get_env "$BASH_SOURCE" "ROOT_AWS_SECRET_ACCESS_KEY")

AWS_REGION=$(get_env "$BASH_SOURCE" "AWS_REGION")

AWS_S3_BUCKET_NAME=$(get_env "$BASH_SOURCE" "AWS_S3_BUCKET_NAME")

GITHUB_TOKEN=$(get_env "$BASH_SOURCE" "GITHUB_TOKEN")
GITHUB_REPOSITORY=$(get_env "$BASH_SOURCE" "GITHUB_REPOSITORY")

if [ -z "$ROOT_AWS_ACCESS_KEY_ID" ]
then
    echo "ROOT_AWS_ACCESS_KEY_ID not passed - skipping AWS IAM, S3 and SES creation/deletion"
    exit 0
fi

if [ -z "$AWS_S3_BUCKET_NAME" ]
then
    AWS_S3_BUCKET_NAME=$PROJECT_NAME
fi

if [ -z "$AWS_REGION" ]
then
    AWS_REGION=eu-central-1
fi

if [ "$1" != "down" ]
then
    ansible-playbook \
        ./aws/create_iam_user.yaml \
        -e "ROOT_AWS_ACCESS_KEY_ID=$ROOT_AWS_ACCESS_KEY_ID \
            ROOT_AWS_SECRET_ACCESS_KEY=$ROOT_AWS_SECRET_ACCESS_KEY \
            PROJECT_NAME=$PROJECT_NAME \
            AWS_S3_BUCKET_NAME=$AWS_S3_BUCKET_NAME \
            ENVIRONMENT_TYPE=$ENVIRONMENT_TYPE" && \
    ansible-playbook \
        ./aws/create_s3.yaml \
        -e "ROOT_AWS_ACCESS_KEY_ID=$ROOT_AWS_ACCESS_KEY_ID \
            ROOT_AWS_SECRET_ACCESS_KEY=$ROOT_AWS_SECRET_ACCESS_KEY \
            AWS_REGION=$AWS_REGION \
            PROJECT_NAME=$PROJECT_NAME \
            AWS_S3_BUCKET_NAME=$AWS_S3_BUCKET_NAME \
            ENVIRONMENT_TYPE=$ENVIRONMENT_TYPE" && \
    ansible-playbook \
        ./aws/fill_github.yaml \
        -e "GITHUB_TOKEN=$GITHUB_TOKEN \
            GITHUB_REPOSITORY=$GITHUB_REPOSITORY \
            AWS_REGION=$AWS_REGION \
            PROJECT_NAME=$PROJECT_NAME \
            AWS_S3_BUCKET_NAME=$AWS_S3_BUCKET_NAME \
            ENVIRONMENT_TYPE=$ENVIRONMENT_TYPE"
else
    ansible-playbook \
        ./aws/clear_github.yaml \
        -e "GITHUB_TOKEN=$GITHUB_TOKEN \
            GITHUB_REPOSITORY=$GITHUB_REPOSITORY \
            ENVIRONMENT_TYPE=$ENVIRONMENT_TYPE" && \
    ansible-playbook \
        ./aws/delete_iam_user.yaml \
        -e "ROOT_AWS_ACCESS_KEY_ID=$ROOT_AWS_ACCESS_KEY_ID \
            ROOT_AWS_SECRET_ACCESS_KEY=$ROOT_AWS_SECRET_ACCESS_KEY \
            PROJECT_NAME=$PROJECT_NAME \
            ENVIRONMENT_TYPE=$ENVIRONMENT_TYPE" && \
    ansible-playbook \
        ./aws/delete_s3.yaml \
        -e "ROOT_AWS_ACCESS_KEY_ID=$ROOT_AWS_ACCESS_KEY_ID \
            ROOT_AWS_SECRET_ACCESS_KEY=$ROOT_AWS_SECRET_ACCESS_KEY \
            PROJECT_NAME=$PROJECT_NAME \
            AWS_S3_BUCKET_NAME=$AWS_S3_BUCKET_NAME \
            ENVIRONMENT_TYPE=$ENVIRONMENT_TYPE"
    
fi