---
issue_number: 310
issue_title: "Add rate limiting and uniform responses to authentication routes"
start_date: 2026-09-25T22:50:00Z
plan_file: thoughts/shared/plans/singlepagestartup/ISSUE-310.md
status: in_progress
---

# Implementation Progress: ISSUE-310 - Add rate limiting and uniform responses to authentication routes

**Started**: 2026-09-26
**Plan**: `thoughts/shared/plans/singlepagestartup/ISSUE-310.md`

## Phase Progress

### Phase 1: Environment values and shared helpers

- [x] Started: 2026-09-25T22:50Z
- [x] Completed: 2026-09-25T23:20Z
- [x] Automated verification: PASSED

**Notes**:
- `NX_DAEMON=false NX_ISOLATE_PLUGINS=false npx nx run @sps/backend-utils:jest:test --skip-nx-cache`: 8 suites, 167 tests passed (new: `client-address/index.spec.ts` 30 tests, `rate-limit/index.spec.ts` 11 tests).
- `npx nx run @sps/shared-utils:jest:test --skip-nx-cache`: 12 suites, 74 tests passed.
- `NODE_OPTIONS=--max-old-space-size=12288 npx nx run-many --target=eslint:lint --projects=@sps/backend-utils,@sps/shared-utils`: passed.
- Mutation checks (each restored afterwards, suite green again): M1 trusted hops ignored → 3 failures; M2 client-written entry trusted → 3 failures; M3 172.16/12 dropped → 2 failures; M4 budget never exceeded → 1 failure; M5 store failure propagates → 2 failures; M6 no `Retry-After` → 1 failure; M7 window index ignored → 1 failure.

### Phase 2: Route limits on the subject authentication routes

- [x] Started: 2026-09-25T23:20Z
- [x] Completed: 2026-09-25T23:45Z
- [x] Automated verification: PASSED (full `@sps/rbac` lane re-run after Phase 4)

**Notes**:
- `npx jest -c libs/modules/rbac/jest.config.ts .../request-rate-limit`: 10 tests passed.
- `NODE_OPTIONS=--max-old-space-size=12288 npx tsc --noEmit -p libs/modules/rbac/tsconfig.json`: first run found one error in the new spec (store mock type), fixed by typing the helper's store as `IRateLimitStoreProvider`; second run exit 0, 0 errors.
- The limiter's default clock became `() => Date.now()` so a spec can move `Date.now` without a new seam.
- Controller diff: 52 insertions, 0 deletions (imports and `middlewares` on seven existing entries).
- Mutation checks: M8 address budget not counted → 2 failures; M9 account budget not counted → 3; M10 private addresses counted → 1; M11 account letter case kept → 1; M12 switch ignored → 1. Restored, 10/10 green.

### Phase 3: Wrong operator secret counter

- [x] Started: 2026-09-25T23:45Z
- [x] Completed: 2026-09-26T00:05Z
- [x] Automated verification: PASSED

**Notes**:
- `NX_DAEMON=false NX_ISOLATE_PLUGINS=false npx nx run @sps/middlewares:jest:test --skip-nx-cache`: 11 suites, 72 tests passed (new spec: 8 tests).
- `npx tsc --noEmit -p libs/middlewares/tsconfig.json`: exit 0, 0 errors. `@sps/middlewares` has no `eslint:lint` target; eslint runs on the files directly in Phase 5.
- Registered in `apps/api/app.ts` after the WebSocket route and before revalidation.
- Mutation checks: M13 wrong secrets never counted → 4 failures; M15 right secret never refused → 1; M16 private addresses counted → 1; M17 presented value written to the log → 1; M18 switch ignored → 1; M14b mismatch logged at debug instead of warn → 4. The first M14 attempt broke compilation (trailing comma inside `void (...)`), so it was redone as a behavioral mutation. Restored, 8/8 green, file identical to the original.

### Phase 4: Uniform login and forgot-password answers

- [x] Started: 2026-09-26T00:05Z
- [x] Completed: 2026-09-26T00:30Z
- [x] Automated verification: PASSED

**Notes**:
- Identity service: one error (`Authentication error. Invalid credentials`) from one statement after one bcrypt round for an unknown address, an identity without a salt and a wrong password; the unknown path hashes with a cost-10 salt generated once per process.
- Forgot-password: `201 { data: { ok: true } }` from one module constant for every address; a code is stored only for exactly one identity linked to a subject.
- `libs/modules/rbac/jest.config.ts`: the ignore now names the two placeholder specs (`email-and-password/(authentication|registration)/`), so `forgot-password.spec.ts` runs; `--listTests` confirms the placeholders stay out.
- `@sps/rbac` lane: 84 suites, 396 tests passed; `@sps/rbac:eslint:lint` passed; `tsc --noEmit -p libs/modules/rbac/tsconfig.json` 0 errors.
- Mutation checks: M19 unknown address refused before hashing → 1 failure; M20 wrong password keeps its own message → 1; M22 unknown address answered 404 again → 1; M23 code stored for an ambiguous address → 1. Restored, both files identical to the originals.

### Phase 5: Deployer wiring, documentation, HTTP proof

- [x] Started: 2026-09-26T00:30Z
- [x] Completed: 2026-09-26T01:20Z
- [x] Automated verification: PASSED

**Notes**:
- Deployer: seven optional settings read with `get_env` (empty when missing), passed to the playbook and written by `api.env.j2` only when set; rendered with Ansible's Jinja2 (`RBAC_RATE_LIMIT_ENABLED=false` and `RBAC_RATE_LIMIT_TRUSTED_PROXIES=2` written, an empty window omitted). `bash -n tools/deployer/api.sh` passed.
- README: "Rate limits" section in `libs/modules/rbac/models/subject/README.md`.
- `node tools/agents/code-placement.mjs`: no same-name file and folder pairs.
- `api:jest:test` 2 suites, 4 tests passed; `api:eslint:lint` passed with 2 warnings in untouched `apps/api/jest.integration.config.ts` and `jest.scenario.config.ts`. `tsc --noEmit -p apps/api/tsconfig.json` reports 25 errors in 16 files, none of them changed on this branch.
- HTTP proof, worktree API on port 4310, local Redis (`scratchpad/proof/proof-defaults.ts`, client addresses simulated with `X-Forwarded-For` as Traefik sets it):
  - unknown email / wrong password: 401 / 401, same body keys, error text equal, `stack` and `cause` equal, mean 68.5 / 63.6 ms over 5 requests (baseline: different text, 90.3 / 178.2 ms)
  - correct login within budget: 201
  - 21 failed logins from one address: 20 × 401, then 429 with a positive integer `Retry-After`, error body keys unchanged; another address meanwhile: 201
  - 11 wrong passwords for one account from 11 addresses: 10 × 401, then 429; right password for that account in the same window: 429; another account: 201
  - forgot-password unknown / known: 201 / 201, bodies equal (baseline 404 / 201)
  - 25 failed logins from localhost (private): 25 × 401
  - 61 `init` calls from one address: 60 × 201, then 429
  - 11 wrong operator secrets from one address: 10 × 200, then 429; right secret from that address 429, from another 200; 11 `Operator secret mismatch` warnings with path, address, attempt count and request id; neither the presented nor the configured secret appears in the log
  - `RBAC_RATE_LIMIT_SESSION_ATTEMPTS_PER_ADDRESS=3`: 3 × 201, then 429
  - `RBAC_RATE_LIMIT_ENABLED=false`: 25 failed logins for one account from one address all 401, 12 wrong secrets all 200 and all 12 logged without an attempt count, no counter written
  - Redis: every `rate-limit:*` key carried a TTL under 60 s and expired on its own; 0 left. Fixtures (two accounts, two `init` subjects) deleted through the API with 200; 0 `issue310-%` identities left in PostgreSQL. Port 4310 free, no launcher left.
- Final re-run after the last edits: backend-utils 167, shared-utils 74, middlewares 72, rbac 396, api 4 tests passed; lint and four `tsc` checks clean.

## Incident Log

> Read this section FIRST before starting any implementation work.
> Parallel agents: check here for known pitfalls before debugging independently.

<!-- incident-count: 1 -->

### Incident 1 — Worktree Redis password did not match the running container

- **Occurrences**: 1
- **Stage**: Research baseline, reused for the Phase 5 proof
- **Symptom**: the worktree API logged `KV connection error: WRONGPASS` at start, so every KV-backed limiter would have failed open silently.
- **Root Cause**: the copied `apps/api/.env` carries a `KV_PASSWORD` that differs from the `REDIS_PASSWORD` of `sps-lite-redis-1`.
- **Fix**: the scratchpad launcher `start-api-4310.sh` reads the container's `REDIS_PASSWORD` into the API process environment with `docker exec`; nothing printed or written.
- **Reusable Pattern**: grep the API log for `WRONGPASS` before any HTTP proof that depends on Redis; a fail-open limiter hides a broken KV connection.

## Summary

### Changes Made

- `libs/shared/utils/src/lib/envs/rbac.ts`: seven `RBAC_RATE_LIMIT_*` settings with documented defaults.
- `libs/shared/backend/utils/src/lib/client-address/`: client address reader and private-network predicate, with spec.
- `libs/shared/backend/utils/src/lib/rate-limit/`: fixed-window KV limiter with deadline, fail-open and throttled reporting, and the 429 refusal, with spec.
- `libs/modules/rbac/models/subject/backend/app/middlewares/src/lib/request-rate-limit/`: `RequestRateLimit` route middleware, with spec; wired into seven routes of the subject controller.
- `libs/middlewares/src/lib/operator-secret-attempts/`: `OperatorSecretAttemptsMiddleware`, with spec; registered in `apps/api/app.ts`.
- Identity service and forgot-password handler: uniform answers, with specs; rbac jest ignore narrowed.
- Deployer templates and `.env.example`; subject README "Rate limits".

### Pull Request

- [ ] PR created: —
- [ ] PR number: —

### Final Status

- [ ] All phases completed
- [ ] All automated verification passed
- [ ] Issue marked as Done

---

**Last updated**: 2026-09-26T01:25:00Z
