#!/bin/bash
./create_env.sh
cd apps/db && ./up.sh && cd ../../
cd apps/redis && ./up.sh && cd ../../
npx nx run api:db:migrate

if [ -d "node_modules" ]; then
  npx playwright install chromium
else
  echo "Skipping Playwright browser install: node_modules not found. Run npm install first."
fi
