#!/bin/bash
. ./get_environment_type.sh

get_environment_type "$2"

./create_inventory.sh || exit 1

./github_deployer.sh "$1" "$ENVIRONMENT_TYPE" && ./github_releaser.sh "$1" "$ENVIRONMENT_TYPE"
