#!/bin/bash
. ./get_env.sh

PROJECT_NAME=$(get_env "$BASH_SOURCE" "PROJECT_NAME")

SENTRY_API_KEY=$(get_env "$BASH_SOURCE" "ROOT_SENTRY_API_KEY")
SENTRY_ORGANIZATION_SLUG=$(get_env "$BASH_SOURCE" "ROOT_SENTRY_ORGANIZATION_SLUG")
SENTRY_TEAM_SLUG=$(get_env "$BASH_SOURCE" "ROOT_SENTRY_TEAM_SLUG")

GITHUB_TOKEN=$(get_env "$BASH_SOURCE" "GITHUB_TOKEN")
GITHUB_REPOSITORY=$(get_env "$BASH_SOURCE" "GITHUB_REPOSITORY")

if [ -z $SENTRY_API_KEY ]
then
    echo "No Sentry API Key provided."
    exit 0
fi

if [ "$1" != "down" ]
then
    SERVICE_NAME=$2
    PLATFORM=$3
    SECRET_NAME=$4

    ansible-playbook \
        ./sentry/create_sentry_project.yaml \
        -e "PROJECT_NAME=$PROJECT_NAME \
            PLATFORM=$PLATFORM \
            SERVICE_NAME=$SERVICE_NAME \
            SENTRY_API_KEY=$SENTRY_API_KEY \
            SENTRY_ORGANIZATION_SLUG=$SENTRY_ORGANIZATION_SLUG \
            SENTRY_TEAM_SLUG=$SENTRY_TEAM_SLUG" && \
    ansible-playbook \
        ./sentry/fill_github.yaml \
        -e "GITHUB_TOKEN=$GITHUB_TOKEN \
            GITHUB_REPOSITORY=$GITHUB_REPOSITORY \
            PROJECT_NAME=$PROJECT_NAME \
            SERVICE_NAME=$SERVICE_NAME \
            SECRET_NAME=$SECRET_NAME"
else
    SERVICE_NAME=$2
    SECRET_NAME=$3

    ansible-playbook \
        ./sentry/delete_sentry_project.yaml \
        -e "PROJECT_NAME=$PROJECT_NAME \
            SENTRY_API_KEY=$SENTRY_API_KEY \
            SERVICE_NAME=$SERVICE_NAME \
            SENTRY_ORGANIZATION_SLUG=$SENTRY_ORGANIZATION_SLUG \
            SENTRY_TEAM_SLUG=$SENTRY_TEAM_SLUG" && \
    ansible-playbook \
        ./sentry/clear_github.yaml \
        -e "GITHUB_TOKEN=$GITHUB_TOKEN \
            GITHUB_REPOSITORY=$GITHUB_REPOSITORY \
            SECRET_NAME=$SECRET_NAME"
fi