---
issue_number: 307
issue_title: "Validate URLs the API fetches on behalf of callers"
start_date: 2026-09-25T21:40:00Z
plan_file: thoughts/shared/plans/singlepagestartup/ISSUE-307.md
status: in_progress
---

# Implementation Progress: ISSUE-307 - Validate URLs the API fetches on behalf of callers

**Started**: 2026-09-26
**Plan**: `thoughts/shared/plans/singlepagestartup/ISSUE-307.md`

## Baseline

- `npx tsc --noEmit -p` for `libs/shared/backend/utils`, `libs/middlewares`, `libs/modules/file-storage`, `libs/shared/utils`: 0 errors each.
- `npx nx run @sps/backend-utils:jest:test`: 6 suites, 126 tests passed.
- `npx nx run @sps/middlewares:jest:test`: 10 suites, 64 tests passed.
- `npx nx run @sps/file-storage:jest:test`: 2 suites, 6 tests passed.
- `npx eslint` on the four files to be changed: clean.

## Phase Progress

### Phase 1: Guard, wrapper and settings

- [x] Started: 2026-09-25T21:45:00Z
- [x] Completed: 2026-09-25T22:20:00Z
- [x] Automated verification: PASSED

**Notes**:

- Added `OUTBOUND_URL_ALLOWED_ORIGINS`, `OUTBOUND_URL_TIMEOUT_MS` (30000) and `OUTBOUND_URL_MAX_RESPONSE_BYTES` (52428800) to `libs/shared/utils/src/lib/envs/api.ts`.
- Added `libs/shared/backend/utils/src/lib/outbound-url/index.ts` (`assertOutboundUrl`, `fetchOutboundUrl`) and its spec; exported both from `src/lib/index.ts`.
- `npx nx run @sps/backend-utils:jest:test`: 7 suites, 188 tests passed (126 before, 62 new).
- `npx nx run @sps/backend-utils:eslint:lint` and `npx nx run @sps/shared-utils:eslint:lint`: passed after `prettier --write` on the new spec.
- `npx tsc --noEmit -p libs/shared/backend/utils/tsconfig.json`: 0 errors.
- Mutation checks on `outbound-url/index.ts`, each restored byte-for-byte from a scratchpad copy afterwards:
  - address check disabled: 28 of 62 tests fail (every refused range, the name cases, the redirect refusals);
  - redirect hops no longer re-checked: 3 fail;
  - plain HTTP sent by name instead of the checked address: 2 fail;
  - credential headers kept across origins: 1 fails.
- Reworked in Phase 4 after Incident 2: the ranges are matched on address bytes instead of `BlockList`, and 8 spec cases cover the textual forms a resolver writes. Final suite: 7 suites, 196 tests. Mutation on the new matcher: address check disabled, 33 of 70 guard tests fail; IPv4 compared without the mapped-form offset, 21 of 70 fail. Restored byte-for-byte both times.

### Phase 2: Call sites

- [x] Started: 2026-09-25T22:20:00Z
- [x] Completed: 2026-09-25T22:55:00Z
- [x] Automated verification: PASSED

**Notes**:

- `create-from-url/index.ts` and `observer/index.ts` call `fetchOutboundUrl` instead of `fetch`. Prettier re-indents the observer's `.then` block because the call no longer fits on one line; ignoring whitespace, each file changes one import and one call.
- New specs: `create-from-url/index.spec.ts` (6 cases) and `observer/index.spec.ts` (3 cases). Both use the real guard and the real `getHttpErrorType`, with DNS, `fetch`, storage and the broadcast SDKs stubbed.
- `npx nx run @sps/file-storage:jest:test`: 3 suites, 12 tests passed (6 before). `npx nx run @sps/middlewares:jest:test`: 11 suites, 67 tests passed (64 before). `npx nx run @sps/backend-utils:jest:test`: 7 suites, 188 tests passed.
- `npx nx run @sps/file-storage:eslint:lint`, `npx nx run @sps/backend-utils:eslint:lint`: passed. `npx eslint` on the two observer files: passed (`@sps/middlewares` has no lint target).
- `npx tsc --noEmit -p` for `libs/shared/backend/utils`, `libs/middlewares`, `libs/modules/file-storage`, `libs/shared/utils`: 0 errors each.
- Mutation check: both call sites restored to the committed plain `fetch`: `create-from-url` 4 of 6 fail (every refusal; the public image and the host-origin download still pass), observer 2 of 3 fail (both refusals; the checkout step still passes). Restored byte-for-byte afterwards.

### Phase 3: Deployer registration and documentation

- [x] Started: 2026-09-25T22:55:00Z
- [x] Completed: 2026-09-25T23:10:00Z
- [x] Automated verification: PASSED

**Notes**:

- The three variables follow `ALLOWED_BILLING_SERVICE_PROVIDERS` in `tools/deployer/.env.example` (defaults written out), `tools/deployer/api.sh` (read and `-e`), `tools/deployer/github_deployer.sh` (read and `SECRETS`), `.github/workflows/ansible.yml` (preview and production arrays) and `tools/deployer/api/api.env.j2` (rendered only when set).
- `bash -n tools/deployer/api.sh` and `bash -n tools/deployer/github_deployer.sh`: passed. `ansible.yml` parses with the YAML loader bundled with Ansible 13.2.0.
- `api.env.j2` rendered with Ansible's Jinja2: no `OUTBOUND_URL_*` line when the variables are unset or empty; all three lines when they are set.
- `libs/modules/file-storage/models/file/README.md`: new "Create from a URL" section with the rules and a settings table. `prettier --check` passes on the README and the workflow; `.env.example` has no Prettier parser.

### Phase 4: HTTP verification

- [x] Started: 2026-09-25T23:10:00Z
- [x] Completed: 2026-09-26T00:20:00Z
- [x] Automated verification: PASSED (second run)

**Notes**:

- Command: `API_SERVICE_PORT=4307 API_SERVICE_URL=http://localhost:4307 NEXT_PUBLIC_API_SERVICE_URL=http://localhost:4307 npm run api:dev`. The process runs `node_modules/bun/bin/bun.exe` (Bun 1.2.5). Requests carried the operator secret read from `apps/api/.env` into a shell variable; only status codes, key names and booleans were printed.
- First run: the four allowed URLs answered 201, and `file:` and credentials answered 400 from the guard, but `127.0.0.1:4307`, `[::1]:4307`, `localhost:5433`, `10.0.0.1`, `192.168.1.1` and `169.254.169.254` were fetched (the log shows the API receiving `GET /` on `127.0.0.1` and `[::1]`, and the private addresses reaching the 30 s deadline). See Incident 2. The four records were deleted (200, then 404 on read).
- Fix verified under the runtime: a scratchpad table of 25 URLs to refuse and 7 to accept, run through `assertOutboundUrl` with Bun 1.2.5 and Bun 1.3.6: 0 mismatches in both.
- Second run, API restarted: public https image 201; public image behind a redirect (`github.com` to its avatar host) 201; public plain-http image 201; own API origin (`/public/...` on `localhost:4307`) 201. `127.0.0.1:4307`, `localhost:5433`, `10.0.0.1`, `192.168.1.1`, `169.254.169.254`, `[::1]:4307`, `file:///etc/hostname` and a URL with credentials each 400 with the guard's message. The log shows no request reaching the API through `127.0.0.1` or `[::1]` and no deadline hit. The four records were deleted (200, then 404).
- Observer run: two throwaway observer messages triggered by `create-from-url` on port 4307. The step to `169.254.169.254` was not sent and its message stayed (200 after the trigger); the step on the API origin ran and its message was deleted (404). The log shows one refusal and no deadline hit. The remaining message and the trigger's file row were deleted (200, then 404).
- Server stopped; port 4307 free; `git status --short --ignored apps/api/public` is empty.

### Phase 5: Review changes (PR #335)

- [x] Started: 2026-09-26T02:00:00Z
- [x] Completed: 2026-09-26T03:10:00Z
- [x] Automated verification: PASSED

**Notes**:

- `b0967ae43f` (before the merge, so that the merge resolution can use it): `fetchOutboundUrl(value, init, options)` with `maxResponseBytes` (default `OUTBOUND_URL_MAX_RESPONSE_BYTES`) and `limitName` (default `response`); a body above the limit is refused with `Payload Too Large error. The <limitName> limit is N bytes`. The outbound URL spec asserts the reader: declared size cancels the body unread, a streamed body stops at the chunk that passes the limit and cancels the source, a caller's smaller limit is named, a caller's larger limit replaces the default. `@sps/backend-utils`: 198 passed. Mutations: caller limit ignored (2 fail), limit name ignored (1 fails), stream not cancelled (1 fails); restored.
- `394578e148`: `git merge origin/claude/issue-304-upload-delivery` without a rebase. Git merged without textual conflicts; see Incident 3 for the two semantic conflicts. Resolution: `create-from-url` passes `{ maxResponseBytes: FILE_STORAGE_MAX_UPLOAD_BYTES, limitName: "upload" }` and `readBody` is removed; #331's route spec stubs `node:dns/promises` with a public answer; the file model README and the deployer example say `OUTBOUND_URL_MAX_RESPONSE_BYTES` bounds observer responses. Mutation: `create-from-url` without the options fails both route 413 cases; restored.
- `42dc7df57c`: #331's streamed `create-from-url` route case keeps its 413 status, upload limit message and nothing-stored checks, without repeating the reader checks.
- Lanes on the final code: `@sps/backend-utils` 7 suites, 201 passed; `@sps/middlewares` 11 suites, 67 passed; `@sps/file-storage` 5 suites, 28 passed. `eslint:lint` for `@sps/backend-utils`, `@sps/shared-utils` and `@sps/file-storage` clean; `npx eslint` on the changed spec clean; `npx tsc --noEmit -p` for the four projects 0 errors; code placement clean.
- HTTP on port 4307 (`node_modules/bun`, 1.2.5), default limits: `https://speed.cloudflare.com/__down?bytes=60000000` and `https://proof.ovh.net/files/1Gb.dat` answer 413 `Payload Too Large error. The upload limit is 52428800 bytes` without downloading the body (the whole run took 4 s); public, redirected, plain-HTTP and own-origin images 201; loopback, private, metadata, `file:` and credential URLs 400. Observer run: the metadata step is not sent, the own-origin step runs and deletes its message.
- HTTP with `FILE_STORAGE_MAX_UPLOAD_BYTES=1024`: a 13 KB image with a declared length and `https://www.google.com/` without a `Content-Length` both answer 413 `Payload Too Large error. The upload limit is 1024 bytes`; an 800-byte file answers 201. Every created record was deleted (200, then 404), and `apps/api/public` is clean.

## Incident Log

> Read this section FIRST before starting any implementation work.
> Parallel agents: check here for known pitfalls before debugging independently.

<!-- incident-count: 3 -->

### Incident 1 — zsh modifier swallowed the lint target name

- **Occurrences**: 2
- **Stage**: Phase 2 - Call sites
- **Symptom**: a loop running `npx nx run $p:eslint:lint` failed with `Cannot find project 'slint'`.
- **Root Cause**: zsh reads `$p:e` as the "extension" history modifier, so the project name collapsed and only `slint:lint` remained.
- **Fix**: brace the variable: `npx nx run "${p}:eslint:lint"`.
- **Reusable Pattern**: in zsh, always write `${var}:target` when a colon follows a variable.
- **Second occurrence** (Phase 5): `git show $B:libs/...` read `:l` as the lower-case modifier; `"${B}:libs/..."` fixed it.

### Incident 2 — the address check passed everything in the API runtime

- **Occurrences**: 1
- **Stage**: Phase 4 - HTTP verification
- **Symptom**: the first HTTP run fetched URLs on `127.0.0.1`, `[::1]`, `localhost:5433`, `10.0.0.1`, `192.168.1.1` and `169.254.169.254`, although the unit suites passed and a standalone Bun probe refused the same URLs.
- **Root Cause**: the API runs `node_modules/bun/bin/bun.exe` (Bun 1.2.5, the `bun` devDependency), because its npm scripts put `node_modules/.bin` first in `PATH`. In Bun 1.2.5 `BlockList.check` from `node:net` returns false for every address. The runtime probes had used the global Bun 1.3.6 and Jest runs under Node; `BlockList` works in both, so neither showed the fault. Temporary debug output inside the running server (removed afterwards) showed a fresh `BlockList` with `10.0.0.0/8` not matching `10.255.255.1`.
- **Fix**: the guard matches its range table on address bytes (IPv4 in the IPv4-mapped form) and no longer uses `BlockList`. Added spec cases for resolver answer forms, checked the table under Bun 1.2.5 and 1.3.6, and repeated the HTTP run.
- **Reusable Pattern**: probe runtime behavior with `node_modules/.bin/bun`, the Bun the API runs, not the global `bun`. Keep security checks in plain JavaScript rather than runtime-specific `node:` helpers, and treat the HTTP run as the only check of the Bun runtime, because the unit lane runs under Node.

### Incident 3 — merging #331 left two semantic conflicts

- **Occurrences**: 1
- **Stage**: Phase 5 - Review changes
- **Symptom**: after a clean textual merge of `origin/claude/issue-304-upload-delivery`, three `create-from-url` cases of #331's route spec failed; with DNS stubbed, one still failed (`cancelled` not called, all 20 chunks pulled).
- **Root Cause**: #331's spec fetched `files.example.com`, which does not resolve, and the guard now resolves the host (400). And the merged handler read the body twice: the guarded fetch took the whole stream under the 50 MiB default before #331's `readBody` applied the upload limit, so the download was no longer cut off early.
- **Fix**: a `node:dns/promises` stub with a public answer in #331's spec, and `create-from-url` passes the upload limit to `fetchOutboundUrl` instead of reading again. The options parameter was committed before the merge, so the merge commit itself is green.
- **Reusable Pattern**: after merging a branch that touches the same call path, run its specs before committing the merge; a clean textual merge can still stack two readers or bypass a stub-free spec through new I/O.

## Summary

### Changes Made

- `libs/shared/backend/utils/src/lib/outbound-url/index.ts` (new): `assertOutboundUrl` and `fetchOutboundUrl(value, init, options)`, exported from `@sps/backend-utils`; a body above the limit is refused with the `Payload Too Large error` category.
- `libs/shared/utils/src/lib/envs/api.ts`: `OUTBOUND_URL_ALLOWED_ORIGINS` (empty), `OUTBOUND_URL_TIMEOUT_MS` (30000), `OUTBOUND_URL_MAX_RESPONSE_BYTES` (52428800).
- `create-from-url/index.ts`: `fetchOutboundUrl` with `FILE_STORAGE_MAX_UPLOAD_BYTES` and the `upload` limit name, replacing `fetch` and #331's `readBody`. `libs/middlewares/src/lib/observer/index.ts`: `fetchOutboundUrl` with the default limit.
- Specs: `outbound-url/index.spec.ts` (72 cases), `create-from-url/index.spec.ts` (6), `observer/index.spec.ts` (3); #331's route spec gains a DNS stub and leaves the reader checks to the outbound URL spec.
- Deployer: `tools/deployer/.env.example`, `api.sh`, `github_deployer.sh`, `api/api.env.j2`, `.github/workflows/ansible.yml`.
- Docs: "Create from a URL" in `libs/modules/file-storage/models/file/README.md`.

### Final verification

- `npx nx run @sps/backend-utils:jest:test` 201 passed; `@sps/middlewares:jest:test` 67 passed; `@sps/file-storage:jest:test` 28 passed (after the merge of #331).
- `eslint:lint` for `@sps/backend-utils`, `@sps/shared-utils`, `@sps/file-storage`, and `npx eslint` on the observer files and the changed route spec: clean.
- `npx tsc --noEmit -p` for `libs/shared/backend/utils`, `libs/middlewares`, `libs/modules/file-storage`, `libs/shared/utils`: 0 errors.
- `node tools/agents/code-placement.mjs`: no same-name file and folder pairs.
- Address table under `node_modules/.bin/bun` (1.2.5): 25 refusals and 7 acceptances as expected, 0 mismatches.
- HTTP runs on the final code: see Phase 5.

### Commits

- `0a3b75c122` fix(backend-utils): validate the URLs the API fetches on behalf of callers
- `78d4f05438`, `0e7e81714d` docs(thoughts): research, plan, progress and the pull request description
- `b0967ae43f` refactor(backend-utils): let the caller of fetchOutboundUrl set the response limit
- `394578e148` Merge branch 'claude/issue-304-upload-delivery' into claude/issue-307-outbound-url-guard
- `42dc7df57c` test(file-storage): leave the response reader checks to the outbound URL spec

### Pull Request

- [x] PR created: https://github.com/singlepagestartup/singlepagestartup/pull/335
- [x] PR number: 335 (description saved as `thoughts/shared/prs/335_description.md`), base `claude/issue-304-upload-delivery`; it returns to `main` when #331 merges

### Final Status

- [x] All phases completed
- [x] All automated verification passed
- [ ] Issue marked as Done

---

**Last updated**: 2026-09-26T03:10:00Z
