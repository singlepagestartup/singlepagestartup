# Summary

Harden the production infrastructure boundary for issue #215 by removing public database and administration paths, enforcing Redis authentication, and reducing normal Traefik log volume.

## Changes

- Enforce Redis `requirepass` in production and local Compose flows while rejecting an empty production password before deployment.
- Default the Redis deployment port to `6379` at every input, render, and runtime boundary without adding post-deploy task discovery or probes.
- Remove public PostgreSQL and Redis Traefik TCP routing plus direct Portainer port `9000`; retain private Swarm overlay connectivity and bootstrap Portainer through HTTPS.
- Default Traefik logging to `INFO`, propagate a temporary `DEBUG` override through deployer and CI configuration, and document restoration.
- Keep PostgreSQL and Redis Ansible deployment as simple render-and-deploy flows, with operational verification documented for the operator.
- Keep one Cloudflare A-record per managed service hostname and stop domain/certificate flows on the first failure.
- Remove the redundant version-sensitive Portainer update after application stack deployments; retain the stack deployment and webhook registration.
- Mask GitHub secret values consistently in MCP and Telegram deployment output.
- Add the canonical ticket, research, plan, process, and implementation-progress artifacts for issue 215.

## Verification

- [x] `bash -n` for all changed shell files.
- [x] `ansible-playbook --syntax-check` for every changed playbook.
- [x] Rendered production Traefik, PostgreSQL, Redis, and Portainer templates pass `docker compose config`.
- [x] Traefik renders `INFO` by default, accepts temporary `DEBUG`, and restores the default.
- [x] Isolated Redis integration proves unauthenticated `PING` is rejected and authenticated `PING` returns `PONG`.
- [x] An empty Redis port input renders as `REDIS_PORT: "6379"` and the resulting Compose document validates.
- [x] `npx nx run api:jest:scenario --testFile=apps/api/specs/scenario/singlepagestartup/issue-152/backend-cart.scenario.spec.ts` (4/4).
- [x] `npx nx run mcp:jest:test --testFile=apps/mcp/lib/oauth.spec.ts` (12/12).
- [x] Supported YAML/Markdown formatting and `git diff --check`.
- [x] All changed Ansible playbooks pass `ansible-playbook --syntax-check`.
- [x] Production deployment completes for LLM, API, MCP, Telegram, and Host without the duplicate Portainer update.
- [x] Production shows every service at `1/1`, only ports `80/443` published, one Traefik DNS address, and a valid Let's Encrypt certificate.
- [x] Fresh production API/MCP/Host/Traefik logs contain no Redis, authentication, certificate, or service-version errors.
- [x] Fresh browser logout/login reaches `/en` with the authenticated `Admin` control.

## Notes

- No database schema or data migration is required.
- Keep production and preview `REDIS_PASSWORD` secrets populated before rollout.
- Deploy as one coordinated infrastructure release. If Redis is recreated separately, restart API and MCP before application verification.
- Redis deployment intentionally stays minimal: password guard, rendered Compose file, and `docker stack deploy`; runtime checks remain operator-driven.
- Prefer fixing forward. Reverting to the old network templates republishes sensitive listeners/routes and requires immediate firewall review.

Closes #215
