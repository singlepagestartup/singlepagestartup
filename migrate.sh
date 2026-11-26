#!/bin/bash

set -euo pipefail

bun --cwd apps/api src/db/check-application-role.ts

# NX not run all commands in project.json after last update
# still looking for solution
npx nx run @sps/providers-db:repository-migrate
npx nx run @sps/file-storage:repository-migrate
npx nx run @sps/broadcast:repository-migrate
npx nx run @sps/website-builder:repository-migrate
npx nx run @sps/notification:repository-migrate
npx nx run @sps/billing:repository-migrate
npx nx run @sps/ecommerce:repository-migrate
npx nx run @sps/crm:repository-migrate
npx nx run @sps/knowledge:repository-migrate
npx nx run @sps/rbac:repository-natural-key-repair-apply
npx nx run @sps/blog:repository-migrate
npx nx run @sps/startup:repository-migrate
npx nx run @sps/social:repository-migrate
npx nx run @sps/rbac:repository-migrate
bun --env-file=apps/api/.env libs/modules/rbac/backend/repository/database/src/lib/migrate-provider-wallets.ts
bun --env-file=apps/api/.env libs/modules/rbac/backend/repository/database/src/lib/retire-chat-tariff.ts
bun --env-file=apps/api/.env apps/api/src/db/workflow-relations.ts
bun --env-file=apps/api/.env libs/modules/social/relations/profiles-to-ecommerce-module-products/backend/repository/database/src/lib/migrate.ts
npx nx run @sps/crm:workflow-finalize
bun --env-file=apps/api/.env apps/api/src/db/chat-ownership-cutover.ts
npx nx run @sps/host:repository-migrate
npx nx run @sps/agent:repository-migrate
npx nx run @sps/analytic:repository-migrate
npx nx run @sps/providers-db:consistency-finalize

if [ "${1:-}" = "seed" ]; then
  npx nx run api:db:seed
fi
