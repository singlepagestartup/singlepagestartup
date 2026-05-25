#!/bin/bash
./create_env.sh
cd apps/db && ./up.sh && cd ../../
cd apps/redis && ./up.sh && cd ../../
if [ "${START_LLM:-false}" = "true" ]; then
  cd apps/llm && ./up.sh && cd ../../
else
  echo "Skipping apps/llm startup. Run START_LLM=true ./up.sh or apps/llm/up.sh to start the local LLM gateway."
fi
npx nx run api:db:migrate
