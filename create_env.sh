#!/bin/bash

if [ "$1" = "host" ]; then
  if [ "$2" = "deployment" ]; then
    cat apps/host/.env.production > apps/host/.env.local
    printenv >> apps/host/.env.local
    exit 0
  fi
elif [ "$1" = "api" ]; then
  if [ "$2" = "deployment" ]; then
    cat apps/api/.env.production > apps/api/.env
    printenv >> apps/api/.env
    exit 0
  fi
fi

cd apps/db && ./create_env.sh
cd ../redis && ./create_env.sh
cd ../host && ./create_env.sh
cd ../api && ./create_env.sh