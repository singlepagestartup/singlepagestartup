#!/bin/bash
# NX not run all commands in project.json after last update
# still looking for solution
npx nx run @sps/file-storage:repository-migrate
npx nx run @sps/broadcast:repository-migrate
npx nx run @sps/website-builder:repository-migrate
npx nx run @sps/notification:repository-migrate
npx nx run @sps/crm:repository-migrate
npx nx run @sps/billing:repository-migrate
npx nx run @sps/blog:repository-migrate
npx nx run @sps/ecommerce:repository-migrate
npx nx run @sps/startup:repository-migrate
npx nx run @sps/rbac:repository-migrate
npx nx run @sps/host:repository-migrate
npx nx run @sps/agent:repository-migrate
npx nx run @sps/telegram:repository-migrate
npx nx run @sps/analytic:repository-migrate

if [ "$1" = "seed" ]; then
  npx nx run api:db:seed
fi