#!/bin/bash
./create_env.sh
cd apps/db && ./up.sh && cd ..
cd apps/redis && ./up.sh && cd ..
npx nx run host:db:migrate
npm run host:dev