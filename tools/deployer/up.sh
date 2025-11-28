#!/bin/bash
. ./get_environment_type.sh

get_environment_type $1

./create_inventory.sh

./server.sh up $ENVIRONMENT_TYPE && \
    ./aws.sh up $ENVIRONMENT_TYPE && \
    ./certbot.sh up $ENVIRONMENT_TYPE && \
    ./traefik.sh up $ENVIRONMENT_TYPE && \
    ./portainer.sh up $ENVIRONMENT_TYPE && \
    ./postgres.sh up $ENVIRONMENT_TYPE && \
    ./redis.sh up $ENVIRONMENT_TYPE && \
    ./api.sh up $ENVIRONMENT_TYPE && \
    ./telegram.sh up $ENVIRONMENT_TYPE && \
    ./host.sh up $ENVIRONMENT_TYPE