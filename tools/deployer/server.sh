#!/bin/bash
. ./get_environment_type.sh

get_environment_type $2

./create_inventory.sh

. ./get_env.sh

RBAC_SECRET_KEY=$(get_env "$BASH_SOURCE" "RBAC_SECRET_KEY")

BACKEND_SERVICE_SUBDOMAIN=$(get_env "$BASH_SOURCE" "BACKEND_SERVICE_SUBDOMAIN")

if [ -z "$BACKEND_SERVICE_SUBDOMAIN" ]
then
    BACKEND_URL=$DOMAIN
else
    BACKEND_URL=$BACKEND_SERVICE_SUBDOMAIN.$DOMAIN
fi

ansible-playbook \
    ./server/create_working_directory.yaml \
    ./server/install_psql.yaml \
    ./server/install_nodejs.yaml \
    ./server/install_bun.yaml \
    ./server/install_docker.yaml \
    ./server/init_docker_swarm.yaml &&
ansible-playbook \
    ./server/set_cron_jobs.yaml \
    -e "BACKEND_URL=$BACKEND_URL \
        RBAC_SECRET_KEY=$RBAC_SECRET_KEY" \