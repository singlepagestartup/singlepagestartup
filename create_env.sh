#!/bin/bash

if [ "$1" = "host" ]; then
  if [ "$2" = "deployment" ]; then
    production_env=$(cat apps/host/.env.production)
    echo $production_env > apps/host/.env.local
    echo $(printenv) > apps/host/.env.local
    exit 0
  fi
else if [ "$1" = "api" ]; then
  if [ "$2" = "deployment" ]; then
    production_env=$(cat apps/api/.env.production)
    echo $production_env > apps/api/.env
    echo $(printenv) > apps/api/.env
    exit 0
  fi
fi

cd apps/db && ./create_env.sh
cd ../redis && ./create_env.sh
cd ../host && ./create_env.sh