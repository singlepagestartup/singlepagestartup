---
issue_number: 306
issue_title: "Scope the HTTP cache to the requesting principal"
start_date: 2026-09-25T21:45:00Z
plan_file: thoughts/shared/plans/singlepagestartup/ISSUE-306.md
status: complete
completed_date: 2026-09-25
---

# Implementation Progress: ISSUE-306 - Scope the HTTP cache to the requesting principal

**Started**: 2026-09-26
**Plan**: `thoughts/shared/plans/singlepagestartup/ISSUE-306.md`

## Baseline (before any change)

- `NX_DAEMON=false NX_ISOLATE_PLUGINS=false npx nx run @sps/middlewares:jest:test --skip-nx-cache`: 10 suites, 64 tests passed.
- `npx tsc --noEmit -p libs/middlewares/tsconfig.json`: exit 0, no output.
- `NODE_OPTIONS=--max-old-space-size=12288 npx eslint libs/middlewares/src/lib/http-cache apps/api/specs/scenario/singlepagestartup/issue-152/backend-cart.scenario.spec.ts apps/api/app.ts`: exit 0.

## Phase Progress

### Phase 1: Credential gate in the HTTP cache middleware

- [x] Started: 2026-09-26
- [x] Completed: 2026-09-26
- [x] Automated verification: PASSED

**Notes**:

- `libs/middlewares/src/lib/http-cache/index.ts`: private `hasCredentials(c)` composes `authorization` and `readRbacSecret` from `@sps/backend-utils`; `isCacheableGet` gains `!this.hasCredentials(c)`; gate comments updated.
- `libs/middlewares/src/lib/http-cache/index.spec.ts`: the `@sps/backend-utils` mock takes the real `authorization` and `readRbacSecret` (`jest.requireActual`); the context double carries a real `Request` as `req.raw`; new suite "the cache serves and stores bodies only for requests without a credential" (11 tests).
- `NX_DAEMON=false NX_ISOLATE_PLUGINS=false npx nx run @sps/middlewares:jest:test --skip-nx-cache`: 10 suites, 75 tests passed (64 before).
- Mutation check, gate removed (`!this.hasCredentials(c)` deleted): 8 failed (all four channels in both credential scenarios), 24 passed; restored and compared with `cmp`.
- Mutation check per reader: keeping only `authorization(c)` fails the 4 operator-secret cases; keeping only `readRbacSecret(c)` fails the 4 subject-token cases; restored.
- `npx tsc --noEmit -p libs/middlewares/tsconfig.json`: exit 0. A deliberate type error in `index.ts` was reported (TS2322), so the command checks this package; reverted.
- `NODE_OPTIONS=--max-old-space-size=12288 npx eslint libs/middlewares/src/lib/http-cache`: exit 0 (the package has no `eslint:lint` target). Prettier check clean.

### Phase 2: Contract documentation

- [x] Started: 2026-09-26
- [x] Completed: 2026-09-26
- [x] Automated verification: PASSED

**Notes**:

- `libs/middlewares/src/lib/http-cache/README.md`: the intro states the credential rule; new section "Credentialed requests" (the four credentials, presence over validity, why a stored body is always anonymous-admitted, what credentialed callers lose, mutations not gated); "Extension seams" states there is no seam for credentialed caching.
- `apps/api/app.ts`: the comment above the cache registration describes the contract; registration lines unchanged.
- `libs/middlewares/src/lib/http-cache/routes/singlepage.ts`: the issue-270 comment restates the reason for the rules; the rules are unchanged.
- `apps/api/specs/scenario/README.md`: credentialed scenario reads are never cached; anonymous reads stay cacheable.
- `NX_DAEMON=false NX_ISOLATE_PLUGINS=false npx nx run api:jest:test --skip-nx-cache`: 2 suites, 4 tests passed (includes the middleware order contract).
- `NODE_OPTIONS=--max-old-space-size=12288 NX_DAEMON=false NX_ISOLATE_PLUGINS=false npx nx run api:eslint:lint --skip-nx-cache`: 0 errors, 2 warnings in `apps/api/jest.integration.config.ts` and `apps/api/jest.scenario.config.ts` (unused eslint-disable directives, untouched files).

### Phase 3: Scenario lane

- [x] Started: 2026-09-26
- [x] Completed: 2026-09-26
- [x] Automated verification: PASSED

**Notes**:

- `apps/api/specs/scenario/singlepagestartup/issue-152/backend-cart.scenario.spec.ts`: the cache test now reads the cart list, quantity and total with the subject token and the fixture product anonymously; the product read must be stored and none of the cart reads may be. The suite header names the cache expectation.
- `npx tsc --noEmit -p apps/api/specs/scenario/tsconfig.json`: exit 0 before and after the change, no errors.
- `npx eslint` on the scenario file: exit 0.
- Run against the fixed API on port 4306 (private Redis, see Incident 1) with a throwaway email-and-password subject registered through the API: `npx jest --config apps/api/jest.scenario.config.ts --runInBand --runTestsByPath apps/api/specs/scenario/singlepagestartup/issue-152/backend-cart.scenario.spec.ts`: 1 suite, 4 tests passed.
- Same command against the unfixed middleware (`git show HEAD:libs/middlewares/src/lib/http-cache/index.ts`), with `--forceExit`: the rewritten test fails at the cart-list assertion (expected false, received true); the other 3 pass. The negative checks therefore observe real keys.
- Cleanup: the scenario deleted its own fixtures; the throwaway subject, its identity, its two subject-to-role links and its subject-to-identity link were deleted through the API (subject then answers 404). One `scenario-currency-*` row from 2026-04-05 predates this work and was left alone.

### Phase 4: HTTP verification

- [x] Started: 2026-09-26
- [x] Completed: 2026-09-26
- [x] Verification: PASSED

**Notes**: API from this worktree on port 4306 with `MIDDLEWARE_HTTP_CACHE=true KV_TTL=300`, against a private Redis on 127.0.0.1:6406 (Incident 1). Statuses, timings, header names and key names only.

- Anonymous `GET /api/ecommerce/products?limit=1` (public through a role-less permission row): #1 200 in 1.00 s, data key `http-cache:data:http://localhost:4306/api/ecommerce/products:v0:t0:<hash>` written with TTL 300; #2 three seconds later 200 in 0.07 s, the same key's TTL at 296 (not rewritten) and one more keyspace hit, no data-key miss. So #2 was answered from the cache.
- Anonymous `GET /api/host/pages/find-by-url?url=/` (allow-listed page read): the same pattern, TTL 300 then 296, one data-key hit.
- Subject token from `GET /api/rbac/subjects/authentication/init` (201): `GET /api/rbac/subjects/<id>/ecommerce-module/orders` with `Authorization: Bearer` 200, with the `rbac.subject.jwt` cookie 200; data keys for the URL 0 after each; the same URL without credentials 400 "Validation error. No token".
- Operator secret: `GET /api/agent/agents?limit=1` with `X-RBAC-SECRET-KEY` 200, with the `rbac.secret-key` cookie 200; data keys 0 after each; the same URL without credentials 403 "Permission error".
- Credentialed mutation: `POST /api/ecommerce/products` with `X-RBAC-SECRET-KEY` 201; the next anonymous `GET /api/ecommerce/products?limit=1` stored a new body under `:v1:t1:` next to the old `:v0:t0:` key, so both the path and the topic version were bumped.
- Before the fix (same instance, `HEAD` version of the middleware): the token-bearing cart read and the operator-secret agents read were each stored (1 data key), and the same URLs without credentials answered 200 with the stored bodies (11 and 291 bytes).
- Upgrade window: after restoring the fix without clearing Redis, those two URLs still answered 200 to anonymous callers from the entries written before the upgrade; `GET /api/http-cache/clear` with `X-RBAC-SECRET-KEY` answered 200, the keys were gone, and the anonymous reads answered 400 and 403.
- Cleanup: throwaway product and subject deleted (200 each); data keys under `http://localhost:4306` deleted; API stopped; private Redis container stopped (`--rm`); throwaway password and scenario credentials deleted from the scratchpad. The shared Redis on 6384 received no keys from this work (the API could not reach it).

### Review round 1: pull request #329

- [x] Started: 2026-09-26
- [x] Completed: 2026-09-26
- [x] Automated verification: PASSED

**Notes**: the lead asked to close the upgrade window in code instead of by an operator clear, and to drop that step from the pull request and the downstream trailer.

- `libs/middlewares/src/lib/http-cache/index.ts`: `CACHE_DATA_PREFIX` is `http-cache:data:v2`, with a comment naming issue #306; `CACHE_VERSION_PREFIX` is unchanged.
- `libs/middlewares/src/lib/http-cache/index.spec.ts`: new spec "places stored bodies under the v2 data namespace"; the clear-route fixture and the admission-cap assertion spell data keys with `v2`.
- `apps/api/specs/scenario/singlepagestartup/issue-152/backend-cart.scenario.spec.ts`: the key builder copy uses `http-cache:data:v2`. Without it the scenario's positive wait would look for the product under the old prefix and time out.
- `libs/middlewares/src/lib/http-cache/README.md`: the Keys section explains the `v2` namespace and that an upgrade needs no flush; the clear route section names `http-cache:data:v2`.
- `NX_DAEMON=false NX_ISOLATE_PLUGINS=false npx nx run @sps/middlewares:jest:test --skip-nx-cache`: 10 suites, 76 tests passed.
- Mutation check, prefix set back to `http-cache:data`: 3 failed (the new namespace spec, the clear-route namespace spec and the admission-cap key assertion), 30 passed; restored and compared with `cmp`.
- `npx tsc --noEmit -p libs/middlewares/tsconfig.json` and `npx tsc --noEmit -p apps/api/specs/scenario/tsconfig.json`: exit 0. `npx eslint` on the http-cache folder and the scenario file: exit 0. Prettier clean.
- Upgrade on a running API (port 4306, private Redis, `MIDDLEWARE_HTTP_CACHE=true`, `KV_TTL=300`): the `main` middleware stored a subject's Bearer-token cart read and an operator-secret `GET /api/agent/agents?limit=1` under `http-cache:data:http://localhost:4306/...`. The v2 build then started on the same Redis without any clear: both old keys were still present (TTL 280), the same URLs without credentials answered 400 "Validation error. No token" and 403 "Permission error", and no `v2` key was created for them. An anonymous `GET /api/ecommerce/products?limit=1` was stored under `http-cache:data:v2:...` (TTL 299) and the next read three seconds later was a hit (TTL 295).
- Issue-152 backend scenario on the v2 build with a throwaway registered subject (`--forceExit`): 4 tests passed, so the scenario's `v2` key builder finds the product body.
- Cleanup: throwaway subjects, identity and links deleted (subject answers 404); keys under both prefixes for port 4306 deleted; API stopped; private Redis container removed; throwaway secrets deleted.
- Publication: the change is commit `27f92da2d9` on top of the published head. Its trailer tells downstream projects not to run the one-time clear that the first fix commit's trailer asks for, and to use the `v2` prefix. Folding the change into the first fix commit and rewording its trailer needs a force push, which the permission system refused (Incident 4).

## Incident Log

> Read this section FIRST before starting any implementation work.
> Parallel agents: check here for known pitfalls before debugging independently.

<!-- incident-count: 4 -->

### Incident 1 — The shared local Redis is unreachable from the host

- **Occurrences**: 1
- **Stage**: Phase 4 - HTTP verification
- **Symptom**: the API on 4306 logged `KV connection error: Command timed out` and `write EPIPE`; a direct ioredis client from the host failed the same way.
- **Root Cause**: `apps/redis/docker-compose.redis.yaml` starts `redis-server --port "${REDIS_PORT:-6379}"` inside the container but maps `${REDIS_PORT}:6379`. With `REDIS_PORT=6384` in `apps/redis/.env`, the container `sps-lite-redis-1` listens on 6384 internally (its log says `port=6384`) while host port 6384 forwards to container port 6379, where nothing listens. The lines date from commit 919623b47f.
- **Fix**: no change to shared infrastructure. The proof and the scenario ran against a private container (`redis:latest`, local image, `127.0.0.1:6406`, throwaway password, removed afterwards) through `KV_HOST`, `KV_PORT` and `KV_PASSWORD` overrides.
- **Reusable Pattern**: when the local Redis times out, compare `docker logs <container>` (`port=`) with `docker port <container>` before debugging the API; a private container keeps a proof off shared state.

### Incident 2 — `kill $pids` stopped nothing under zsh

- **Occurrences**: 1
- **Stage**: Phase 4 - HTTP verification
- **Symptom**: after `kill $pids` the API still listened on 4306.
- **Root Cause**: zsh does not split an unquoted variable into words, so `kill` received one invalid argument.
- **Fix**: signal each pid in a loop; an orphaned `bun --watch` process from this worktree needed `kill -9` after checking its cwd.
- **Reusable Pattern**: in zsh iterate over pids (`for pid in $(...)`), and confirm a process's cwd before force-stopping it on a machine shared with other agents.

### Incident 3 — The scenario jest process did not exit

- **Occurrences**: 1
- **Stage**: Phase 3 - Scenario lane
- **Symptom**: all 4 tests had finished (the API log showed the fixture cleanup), but jest kept running for ten minutes with its output buffered by the pipe.
- **Root Cause**: the scenario builds a Redis-backed `KvProvider` whose singleton connection stays open, so jest waits for the open handle. Unrelated to this change.
- **Fix**: stopped the process to flush the results; later runs used `--forceExit`.
- **Reusable Pattern**: run Redis-backed scenario files with `--forceExit` when invoking jest directly.

### Incident 4 — Force push of a reworded commit refused

- **Occurrences**: 1
- **Stage**: Review round 1
- **Symptom**: `git push --force-with-lease` of the branch with the reworded fix commit was denied by the auto mode permission classifier ("Git Destructive").
- **Root Cause**: dropping the clear step from the published fix commit's trailer requires rewriting published history, which the session's permission rules do not allow.
- **Fix**: rebuilt on the published head; the namespace change is a separate commit whose trailer supersedes the earlier step. The reworded line stays local under `backup/issue-306-reworded`.
- **Reusable Pattern**: write trailers for the final design before the first push; after publication, supersede instead of rewording unless a force push is explicitly allowed.

## Summary

### Changes Made

- `libs/middlewares/src/lib/http-cache/index.ts`: credential gate on the cacheable-GET decision; stored bodies under `http-cache:data:v2`.
- `libs/middlewares/src/lib/http-cache/index.spec.ts`: real credential readers in the mock, a real request in the context double, and the new BDD suite.
- `libs/middlewares/src/lib/http-cache/README.md`: the credential rule and its cost; the `v2` data namespace.
- `libs/middlewares/src/lib/http-cache/routes/singlepage.ts`: issue-270 comment (rules unchanged).
- `apps/api/app.ts`: comment above the cache registration.
- `apps/api/specs/scenario/singlepagestartup/issue-152/backend-cart.scenario.spec.ts`: the cache scenario asserts the new contract; its key builder uses the `v2` prefix.
- `apps/api/specs/scenario/README.md`: cache notes.

### Pull Request

- [x] PR created: https://github.com/singlepagestartup/singlepagestartup/pull/329
- [x] PR number: 329 (description saved to `thoughts/shared/prs/329_description.md`)

### Final Status

- [x] All phases completed
- [x] All automated verification passed
- [ ] Issue marked as Done (after review and merge)

---

**Last updated**: 2026-09-25T22:17:02Z
