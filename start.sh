#!/bin/bash

# Run host app
# if first passed argument is "host" run npm run host:start
if [ "$1" = "host" ]; then
  ./create_env.sh host deployment
  npm run host:start
  exit 0
else if [ "$1" = "api" ]; then
  ./create_env.sh api deployment
  ./migrate.sh seed &
  npm run api:start
  exit 0
fi