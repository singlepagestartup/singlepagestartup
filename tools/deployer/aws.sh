#!/bin/bash
. ./get_environment_type.sh

get_environment_type "$2"

./create_inventory.sh || exit 1

. ./get_env.sh
. ./ansible_vars.sh

PROJECT_NAME=$(get_env "$BASH_SOURCE" "PROJECT_NAME")

ROOT_AWS_ACCESS_KEY_ID=$(get_env "$BASH_SOURCE" "ROOT_AWS_ACCESS_KEY_ID")
ROOT_AWS_SECRET_ACCESS_KEY=$(get_env "$BASH_SOURCE" "ROOT_AWS_SECRET_ACCESS_KEY")

AWS_REGION=$(get_env "$BASH_SOURCE" "AWS_REGION")

AWS_S3_BUCKET_NAME=$(get_env "$BASH_SOURCE" "AWS_S3_BUCKET_NAME")
AWS_S3_DEV_BUCKET_NAME=$(get_env "$BASH_SOURCE" "AWS_S3_DEV_BUCKET_NAME")

GITHUB_TOKEN=$(get_env "$BASH_SOURCE" "GITHUB_TOKEN")
GITHUB_REPOSITORY=$(get_env "$BASH_SOURCE" "GITHUB_REPOSITORY")

if [ -z "$ROOT_AWS_ACCESS_KEY_ID" ]
then
    echo "ROOT_AWS_ACCESS_KEY_ID not passed - skipping AWS IAM, S3 and SES creation/deletion"
    exit 0
fi

if [ -z "$AWS_REGION" ]
then
    AWS_REGION=eu-central-1
fi

if [ "$1" != "down" ]
then
    ansible_with_vars ./aws/create_iam_user.yaml \
        ROOT_AWS_ACCESS_KEY_ID ROOT_AWS_SECRET_ACCESS_KEY PROJECT_NAME AWS_S3_BUCKET_NAME \
        AWS_S3_DEV_BUCKET_NAME ENVIRONMENT_TYPE || exit 1

    if [ -n "$AWS_S3_BUCKET_NAME" ] || [ -n "$AWS_S3_DEV_BUCKET_NAME" ]
    then
        ansible_with_vars ./aws/create_s3.yaml \
            ROOT_AWS_ACCESS_KEY_ID ROOT_AWS_SECRET_ACCESS_KEY AWS_REGION \
            AWS_S3_BUCKET_NAME AWS_S3_DEV_BUCKET_NAME ENVIRONMENT_TYPE || exit 1
    else
        echo "S3 bucket names are empty - skipping S3 creation; SES remains configured"
    fi

    ansible_with_vars ./aws/fill_github.yaml \
        GITHUB_TOKEN GITHUB_REPOSITORY AWS_REGION PROJECT_NAME AWS_S3_BUCKET_NAME \
        AWS_S3_DEV_BUCKET_NAME ENVIRONMENT_TYPE
else
    if [ -n "$AWS_S3_BUCKET_NAME" ] || [ -n "$AWS_S3_DEV_BUCKET_NAME" ]
    then
        ansible_with_vars ./aws/delete_s3.yaml \
            ROOT_AWS_ACCESS_KEY_ID ROOT_AWS_SECRET_ACCESS_KEY AWS_REGION \
            AWS_S3_BUCKET_NAME AWS_S3_DEV_BUCKET_NAME ENVIRONMENT_TYPE || exit 1
    fi

    ansible_with_vars ./aws/clear_github.yaml \
        GITHUB_TOKEN GITHUB_REPOSITORY ENVIRONMENT_TYPE || exit 1
    ansible_with_vars ./aws/delete_iam_user.yaml \
        ROOT_AWS_ACCESS_KEY_ID ROOT_AWS_SECRET_ACCESS_KEY PROJECT_NAME ENVIRONMENT_TYPE
fi
