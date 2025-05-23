#!/bin/bash
. ./get_environment_type.sh

get_environment_type $1

./create_inventory.sh

./host.sh down $ENVIRONMENT_TYPE && \
    ./telegram.sh down $ENVIRONMENT_TYPE && \
    ./api.sh down $ENVIRONMENT_TYPE && \
    ./redis.sh down $ENVIRONMENT_TYPE && \
    ./postgres.sh down $ENVIRONMENT_TYPE && \
    ./portainer.sh down $ENVIRONMENT_TYPE && \
    ./traefik.sh down $ENVIRONMENT_TYPE && \
    ./aws.sh down $ENVIRONMENT_TYPE