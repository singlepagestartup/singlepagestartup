#!/bin/bash

# Run host app
# if first passed argument is "host" run npm run host:start
if [ "$1" = "host" ]; then
  ./create_env.sh deployment
  npx nx run host:db:seed
  npm run host:start
  exit 0
fi