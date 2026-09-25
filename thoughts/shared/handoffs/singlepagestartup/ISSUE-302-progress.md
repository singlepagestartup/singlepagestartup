---
issue_number: 302
issue_title: "Review the payment webhook provider gate"
start_date: 2026-09-25T21:15:00Z
plan_file: thoughts/shared/plans/singlepagestartup/ISSUE-302.md
status: in_progress
---

# Implementation Progress: ISSUE-302 - Review the payment webhook provider gate

**Started**: 2026-09-26
**Plan**: `thoughts/shared/plans/singlepagestartup/ISSUE-302.md`

## Baseline (before any change)

- `npx tsc --noEmit -p libs/modules/billing/tsconfig.json`: exit 0, 0 errors.
- `npx tsc --noEmit -p libs/shared/utils/tsconfig.json`: exit 0, 0 errors.
- `npx tsc --noEmit -p apps/api/specs/scenario/tsconfig.json`: exit 0, 0 errors.
- `NX_DAEMON=false NX_ISOLATE_PLUGINS=false npx nx run @sps/billing:jest:test --skip-nx-cache`: 4 suites, 12 tests passed.
- `node tools/agents/code-placement.mjs`: exit 0.
- HTTP reproduction on the unchanged code, API from this worktree on port 4302
  with `ALLOWED_BILLING_SERVICE_PROVIDERS=stripe,0xprocessing,payselection,cloudpayments,tiptoppay`,
  one throwaway invoice, payment intent and relation per call, each deleted
  afterwards (read after delete: 404):
  - anonymous `POST /api/billing/payment-intents/dummy/webhook`: 200, keys `data`; invoice `paid`, payment intent `succeeded`.
  - the same call with the operator secret: 200; invoice `paid`, payment intent `succeeded`.
  - anonymous `POST /api/billing/payment-intents/not-a-provider/webhook`: 403 from the authorization middleware; fixture unchanged.

## Phase Progress

### Phase 1: Shared predicate and both handlers

- [x] Started: 2026-09-25T21:16:00Z
- [x] Completed: 2026-09-25T21:20:00Z
- [x] Automated verification: PASSED

**Notes**:

- `isProviderAllowed({ provider })` added to the singlepage payment-intent service; the creation handler calls it at the position of the old inline check; the webhook handler calls it right after reading the provider name.
- `NX_DAEMON=false NX_ISOLATE_PLUGINS=false npx nx run @sps/billing:jest:test --skip-nx-cache`: 7 suites, 22 tests passed (baseline 4 and 12; new: service 3, webhook 5, creation 2).
- `NODE_OPTIONS=--max-old-space-size=12288 NX_DAEMON=false NX_ISOLATE_PLUGINS=false npx nx run @sps/billing:eslint:lint --skip-nx-cache`: passed after `prettier --write` on the service spec (first run: 1 prettier error).
- `NODE_OPTIONS=--max-old-space-size=12288 npx tsc --noEmit -p libs/modules/billing/tsconfig.json`: exit 0, 0 errors.
- Mutation checks, each file restored byte for byte (`cmp`):
  - webhook gate removed: webhook spec 1 failed (`refuses a dummy webhook when the list leaves dummy out`), 4 passed.
  - creation gate removed: creation spec 1 failed (`refuses a provider the list leaves out`), 1 passed.
  - predicate as `String.includes` on the whole list: service spec 1 failed (`refuses a provider that only partly matches a listed entry`).
  - predicate as a per-entry prefix match: the same scenario failed.

### Phase 2: Default list, environment templates and docs

- [x] Started: 2026-09-25T21:22:00Z
- [x] Completed: 2026-09-25T21:24:47Z
- [x] Automated verification: PASSED

**Notes**:

- Default list without `dummy` and a doc comment in `libs/shared/utils/src/lib/envs/host.ts`; `host.spec.ts` beside it loads the module with the variable unset and set.
- `apps/api/create_env.sh` writes the previous default, `dummy` included, for local development; `tools/deployer/.env.example` drops `dummy` and explains it; the payment-intent README documents both routes, the list and `dummy`.
- `NX_DAEMON=false NX_ISOLATE_PLUGINS=false npx nx run @sps/shared-utils:jest:test --skip-nx-cache`: first run 12 of 13 suites passed, 75 tests passed, one worker ended with SIGSEGV in `telegram-bot-service-messages/singlepage.spec.ts` (incident 3); two re-runs: 13 suites, 76 tests passed.
- `NODE_OPTIONS=--max-old-space-size=12288 NX_DAEMON=false NX_ISOLATE_PLUGINS=false npx nx run @sps/shared-utils:eslint:lint --skip-nx-cache`: passed.
- `NODE_OPTIONS=--max-old-space-size=12288 npx tsc --noEmit -p libs/shared/utils/tsconfig.json`: exit 0, 0 errors.
- `bash -n apps/api/create_env.sh`: exit 0. The script run in a throwaway tree (throwaway `db` and `redis` env files, deleted afterwards) exited 0 and wrote the key once with the previous default, `dummy` included.
- `npx prettier --check` on `host.ts`, `host.spec.ts` and the README: clean.

### Phase 3: DB-backed scenario and HTTP proof

- [x] Started: 2026-09-25T21:26:00Z
- [x] Completed: 2026-09-25T21:41:21Z
- [x] Automated verification: PASSED

**Notes**:

- Scenario `apps/api/specs/scenario/singlepagestartup/issue-302/backend-provider-webhook-gate.scenario.spec.ts`: a zero-amount invoice and payment intent created through the server SDKs; the webhook is posted with the operator secret for a provider name outside the list and for the first listed provider. Run directly against the API on port 4302 with `API_SERVICE_URL=http://localhost:4302 NEXT_PUBLIC_API_SERVICE_URL=http://localhost:4302 ALLOWED_BILLING_SERVICE_PROVIDERS=<the API's list> npx jest --config apps/api/jest.scenario.config.ts --runInBand --runTestsByPath <spec>` (not through `test:scenario:issue`, whose preflight clears the shared HTTP cache that other agents use).
  - list without `dummy`: 2 passed.
  - mutation, webhook gate removed while the watch-mode API restarted: 1 failed (`Expected: 400, Received: 200`), 1 passed; restored byte for byte, 2 passed.
  - list with `dummy`: 2 passed.
- `NODE_OPTIONS=--max-old-space-size=12288 npx tsc --noEmit -p apps/api/specs/scenario/tsconfig.json`: exit 0, 0 errors.
- `NODE_OPTIONS=--max-old-space-size=12288 NX_DAEMON=false NX_ISOLATE_PLUGINS=false npx nx run api:eslint:lint --skip-nx-cache`: passed; 2 warnings in untouched `apps/api/jest.integration.config.ts` and `apps/api/jest.scenario.config.ts`.
- `node tools/agents/code-placement.mjs`: exit 0.
- HTTP proof, API from this worktree on port 4302 (`npm run api:dev` with `API_SERVICE_PORT`, `API_SERVICE_URL` and `NEXT_PUBLIC_API_SERVICE_URL` set to port 4302), one throwaway fixture per call, deleted afterwards (read after delete: 404):
  - list `stripe,0xprocessing,payselection,cloudpayments,tiptoppay`: anonymous `dummy` webhook 400, keys `cause, error, method, path, requestId, stack, status`; with the operator secret 400; `not-a-provider` with the operator secret 400; every fixture stayed `open` / `requires_payment_method`. A listed `stripe` call passed the gate and failed in its branch with 500 (the Stripe SDK rejects the missing event id before any request).
  - variable empty, so the code default applies: anonymous `dummy` webhook 400; fixture stayed `open` / `requires_payment_method`.
  - list with `dummy`: anonymous `dummy` webhook 200, keys `data`; invoice `paid`, payment intent `succeeded` (the behavior projects that list `dummy` keep). `not-a-provider` with the operator secret 400.
  - list with `dummy`, full flow: `POST /api/billing/payment-intents/:uuid/dummy` 201 with the invoice; invoice `open` right after; 13 s later invoice `paid` and payment intent `succeeded` through the handler's own webhook call; throwaway currency, payment intent and invoice deleted (reads after delete: 404).
- The OpenAPI `paths.yaml` files document success responses only (no module file lists a 400), so the payment-intent paths stay unchanged.

## Incident Log

> Read this section FIRST before starting any implementation work.
> Parallel agents: check here for known pitfalls before debugging independently.

<!-- incident-count: 4 -->

### Incident 1 — A process-name kill can reach other agents' API servers

- **Occurrences**: 1
- **Stage**: Research (HTTP reproduction)
- **Symptom**: after stopping the port 4302 listener, `pkill -f "nx run api:dev"` ran at about 2026-09-25T21:04Z. The pattern matches every `npm run api:dev` on the machine, including other agents' servers in their own worktrees.
- **Root Cause**: stopping a dev server by command pattern instead of by the PID that this session started.
- **Fix**: afterwards only the telegram app on port 8000 was running an API-like process, and no other agent listener existed on ports 4300-4322; the lead is told the time in case an agent saw its API stop. Later stops signal only this worktree's own process chain (incident 4).
- **Reusable Pattern**: never stop a dev server with `pkill -f` on a command line that other worktrees share; signal the chain that belongs to the assigned port and worktree.

### Incident 2 — An exact-match scenario that a substring mutation survived

- **Occurrences**: 1
- **Stage**: Phase 1 - Shared predicate and both handlers
- **Symptom**: with the predicate mutated to `ALLOWED_BILLING_SERVICE_PROVIDERS.includes(provider)`, the service spec still passed.
- **Root Cause**: the scenario checked a name longer than a listed entry (`payselection-international` against `payselection`); a substring test on the list string only admits names that are part of the list, such as `payselection` against `payselection-international`.
- **Fix**: the scenario now lists `payselection-international` and checks both `payselection` and `payselection-international-rub`; the substring and prefix mutations both fail it.
- **Reusable Pattern**: for an allow-list, test a name that is a part of an entry and a name that extends an entry, and mutation-check both directions.

### Incident 3 — A jest worker crashed with SIGSEGV under machine load

- **Occurrences**: 1
- **Stage**: Phase 2 - Default list, environment templates and docs
- **Symptom**: `@sps/shared-utils:jest:test` reported 1 failed suite with 0 failed tests: the worker running `telegram-bot-service-messages/singlepage.spec.ts` was terminated with SIGSEGV.
- **Root Cause**: the worker process crashed while the machine ran at a load average near 32 with several agents testing in parallel; the suite does not touch the changed files.
- **Fix**: re-ran the lane twice; both runs passed all 13 suites and 76 tests.
- **Reusable Pattern**: a suite failure with no failing test and a signal in the message is an environment crash; re-run before investigating the code.

### Incident 4 — Stopping the watch-mode API took the whole process chain

- **Occurrences**: 1
- **Stage**: Phase 3 - DB-backed scenario and HTTP proof
- **Symptom**: SIGTERM to the port 4302 listener alone left `bun run --watch server.ts` running; a follow-up `kill $MINE` with several PIDs in one variable signalled nothing.
- **Root Cause**: the listener did not exit on one SIGTERM while its `bun run dev`, nx and npm parents were alive; the Bash tool runs zsh, which does not split an unquoted variable into words, so `kill` received one invalid PID and `kill -0` in the loop hid the error.
- **Fix**: `stop-4302.sh` in the session scratchpad walks from the listener up through every ancestor whose working directory is inside this worktree and signals those PIDs as separate arguments; port 4302 was free after each stop.
- **Reusable Pattern**: stop a dev server by its own process chain, checked by working directory, with PIDs passed as an array; do not rely on word splitting in zsh.

## Summary

### Changes Made

- `libs/modules/billing/models/payment-intent/backend/app/api/src/lib/service/singlepage/index.ts`: `isProviderAllowed({ provider })`, an exact match against `ALLOWED_BILLING_SERVICE_PROVIDERS`.
- `.../controller/singlepage/provider/index.ts`: payment creation uses the predicate at the position of its old inline check.
- `.../controller/singlepage/provider-webhook/index.ts`: the webhook refuses an unlisted provider with 400 before reading the body.
- `libs/shared/utils/src/lib/envs/host.ts`: default list without `dummy`, with a doc comment.
- `apps/api/create_env.sh`: local environments list the providers explicitly, `dummy` included.
- `tools/deployer/.env.example`: the example list drops `dummy`; a comment explains when to add it.
- `libs/modules/billing/models/payment-intent/README.md`: "Payment providers" section.
- Specs: `service/singlepage/index.spec.ts`, `controller/singlepage/provider-webhook/index.spec.ts`, `controller/singlepage/provider/index.spec.ts`, `libs/shared/utils/src/lib/envs/host.spec.ts`, `apps/api/specs/scenario/singlepagestartup/issue-302/backend-provider-webhook-gate.scenario.spec.ts`.
- Final run of both unit lanes (`npx nx run-many --target=jest:test --projects=@sps/billing,@sps/shared-utils --skip-nx-cache`): billing 7 suites, 22 tests; shared-utils 13 suites, 76 tests; all passed.

### Pull Request

- [ ] PR created: —
- [ ] PR number: —

### Final Status

- [ ] All phases completed
- [ ] All automated verification passed
- [ ] Issue marked as Done

---

**Last updated**: 2026-09-25T21:24:47Z
