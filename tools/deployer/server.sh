#!/bin/bash
. ./get_environment_type.sh

get_environment_type $2

. ./get_env.sh

if [ -z "${DATABASE_BACKUP_RETENTION_DAYS:-}" ]; then
    DATABASE_BACKUP_RETENTION_DAYS=$(get_env_or_default "$BASH_SOURCE" "DATABASE_BACKUP_RETENTION_DAYS" "14")
fi
if [[ ! "$DATABASE_BACKUP_RETENTION_DAYS" =~ ^[0-9]{1,9}$ ]]; then
    echo "DATABASE_BACKUP_RETENTION_DAYS must contain 1 to 9 decimal digits" >&2
    exit 1
fi

./create_inventory.sh

ansible-playbook \
    ./server/create_working_directory.yaml \
    ./server/install_psql.yaml \
    ./server/install_nodejs.yaml \
    ./server/install_bun.yaml \
    ./server/install_docker.yaml \
    ./server/init_docker_swarm.yaml &&
ansible-playbook \
    ./server/set_cron_jobs.yaml \
    -e "DATABASE_BACKUP_RETENTION_DAYS=$DATABASE_BACKUP_RETENTION_DAYS"
