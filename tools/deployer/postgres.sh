#!/bin/bash
. ./get_environment_type.sh

get_environment_type $2

action=${1:-up}
case "$action" in
    up|down|migrate-role) ;;
    *) echo "Usage: ./postgres.sh {up|down|migrate-role} [environment]" >&2; exit 2 ;;
esac

./create_inventory.sh || exit 1

. ./get_env.sh
. ./ansible_vars.sh

DATABASE_NAME=$(get_env "$BASH_SOURCE" "DATABASE_NAME")
DATABASE_USERNAME=$(get_env "$BASH_SOURCE" "DATABASE_USERNAME")
DATABASE_PASSWORD=$(get_env "$BASH_SOURCE" "DATABASE_PASSWORD")
POSTGRES_USER=$(get_env "$BASH_SOURCE" "POSTGRES_USER")
POSTGRES_PASSWORD=$(get_env "$BASH_SOURCE" "POSTGRES_PASSWORD")

GITHUB_TOKEN=$(get_env "$BASH_SOURCE" "GITHUB_TOKEN")
GITHUB_REPOSITORY=$(get_env "$BASH_SOURCE" "GITHUB_REPOSITORY")

if [ "$action" != "down" ]
then
    export DATABASE_NAME DATABASE_USERNAME DATABASE_PASSWORD POSTGRES_USER POSTGRES_PASSWORD
    POSTGRES_DB="$DATABASE_NAME" sh ../../apps/db/create_application_role.sh --check-config || exit 1
    if [ "$action" = "migrate-role" ]; then
        exec ansible-playbook ./postgres/migrate_application_role.yaml
    fi
    ansible-playbook ./postgres/create_postgres.yaml &&\
    ansible_with_vars ./postgres/fill_github.yaml \
        GITHUB_TOKEN GITHUB_REPOSITORY ENVIRONMENT_TYPE
else
    ansible-playbook \
        ./postgres/delete_postgres.yaml && \
    ansible_with_vars ./postgres/clear_github.yaml \
        GITHUB_TOKEN GITHUB_REPOSITORY ENVIRONMENT_TYPE
fi
