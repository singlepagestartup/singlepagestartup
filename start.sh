#!/bin/bash

if [ "$1" = "host" ]; then
  ./create_env.sh host deployment
  npm run host:start
  exit 0
elif [ "$1" = "api" ]; then
  ./create_env.sh api deployment
  ./migrate.sh seed &
  npm run api:start
  exit 0
elif [ "$1" = "telegram" ]; then
  ./create_env.sh telegram deployment
  npm run telegram:start
  exit 0
fi

echo "Usage: ./start.sh [host|api|telegram]"
exit 1