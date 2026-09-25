---
issue_number: 315
issue_title: "Review the host revalidation route access model"
start_date: 2026-09-25T21:40:00Z
plan_file: thoughts/shared/plans/singlepagestartup/ISSUE-315.md
status: complete
completed_date: 2026-09-26
---

# Implementation Progress: ISSUE-315 - Review the host revalidation route access model

**Started**: 2026-09-26
**Plan**: `thoughts/shared/plans/singlepagestartup/ISSUE-315.md`

## Phase Progress

### Phase 1: Shared contract and host guard

- [x] Started: 2026-09-25T21:40:00Z
- [x] Completed: 2026-09-25T22:10:00Z
- [x] Automated verification: PASSED

**Notes**:

- `HOST_SERVICE_REVALIDATION_SECRET` in `libs/shared/utils/src/lib/envs/host.ts` (no default), `HOST_SERVICE_REVALIDATION_SECRET_HEADER = "X-HOST-REVALIDATION-SECRET"` in `libs/shared/utils/src/lib/constants/index.ts`.
- `apps/host/app/api/revalidate/route.ts`: unset secret → `console.warn` naming the variable and 401; header mismatch → 401 without a log line; the comparison is a private function beside the handler (length check, then `timingSafeEqual`). The import is `crypto`, not `node:crypto`: the host's only other Node built-in imports (`fs/promises`, `path` in the image-generator route) use the unprefixed form in its production build.
- `apps/host/app/api/revalidate/route.spec.ts`: 10 scenarios.
- `host:jest:test`: 3 suites, 24 tests passed (baseline 2 and 14).
- Mutations, each restored: guard removed → 7 refusal scenarios fail, the 3 caller scenarios pass; comparison reduced to a non-empty check → the near-miss, shorter and longer scenarios fail; unset check removed → the unconfigured-host scenario fails.
- `host:eslint:lint` and `@sps/shared-utils:eslint:lint`: passed. `npx tsc --noEmit -p apps/host/tsconfig.json`: exit 0, no errors. After the import changed to `crypto`, a tsconfig extending the host's with only `route.ts` in `files`: exit 0, no errors (a second whole-host run was slowed by a load average above 40 from other agents).

### Phase 2: API senders and boot report

- [x] Started: 2026-09-25T22:10:00Z
- [x] Completed: 2026-09-25T22:45:00Z
- [x] Automated verification: PASSED

**Notes**:

- Middleware `revalidateTag`: `encodeURIComponent(tag)`, the header, a `logger.warn` with the status on a non-OK answer, and `logger.error` with the reason on a network error (was `console.log`).
- Seed: the host call sends the revalidation header instead of `X-RBAC-SECRET-KEY`; the log label names `/api/revalidate`.
- Agent page cache: `encodeURIComponent(path)` and the header.
- Boot report: the variable added to `CHECKED_SECRET_NAMES` after the MCP exchange secret; reported, not fatal.
- Unit lanes: `@sps/middlewares` 10 suites and 70 tests (baseline 64), `@sps/agent` 17 and 89 (baseline 88), `api` 4 tests, `@sps/shared-utils` 12 and 74, `host` 24; all passed.
- Mutations, each restored: middleware without the header → 3 scenarios fail; without the encoding → the encoded-tag scenario fails; without the refusal warning → the refusal scenario fails; agent without the encoding or the header → its new scenario fails; boot report without the name → the ordered assessment fails.
- Lint: `@sps/agent:eslint:lint` passed; `api:eslint:lint` 0 errors, 2 pre-existing warnings in `apps/api/jest.integration.config.ts` and `jest.scenario.config.ts`; `npx eslint` on the middleware files passed (the project has no lint target).
- Types: `tsc --noEmit` for `libs/middlewares`, `libs/modules/agent`, `libs/shared/utils`: 0 errors. `apps/api`: 25 errors in 16 files, none changed from `78d7d43125` and none referencing the new names.
- HTTP proof, API on 4315 against a stub host on 43151 that records booleans only:
  - With one generated value on both: `POST /api/blog/categories` 201 and `DELETE` 200 (then `GET` 404); the stub received `GET /api/revalidate?tag=%2Fapi%2Fblog%2Fcategories` and, for the delete, the entity tag and the collection tag, each with `queryKeys=['tag']`, `headerPresent=True`, `headerMatches=True`. No boot finding for the variable.
  - With the value unset on the API: boot log `[secret-strength] HOST_SERVICE_REVALIDATION_SECRET: missing, no value is set.`; writes still 201 and 200; the stub received the same three calls with `headerMatches=False` and answered 401; the API logged `[WARN] Host revalidation of /api/blog/categories answered 401. ...` once per call.
  - Both fixtures deleted, both processes stopped, ports free afterwards.

### Phase 3: Environment carriers and documentation

- [x] Started: 2026-09-25T22:45:00Z
- [x] Completed: 2026-09-25T23:10:00Z
- [x] Automated verification: PASSED

**Notes**:

- Local: `apps/api/create_env.sh` generates the value, `apps/host/create_env.sh` copies it from `../api/.env`, the root `create_env.sh` runs the API before the host.
- Deployer: `.env.example`, `api.sh`, `host.sh`, `api/api.env.j2` (host block), `host/host.env.local.j2`, `github_deployer.sh`, and both lists in `.github/workflows/ansible.yml`.
- Docs: `tools/deployer/README.md` (secrets to generate, rotation row, "Host revalidation secret" section with the upgrade step), `libs/middlewares/src/lib/revalidation/README.md` (section 5).
- `bash -n` passed on the six changed scripts.
- Ansible rendered both templates with dummy values: the variable line is present with the value, and renders empty without failing when the deployer `.env` lacks it.
- Scratch copy of the bootstrap layout: with the new order the host value equals the API's 64-character hex value; with the base order the host value is empty. Both files are mode 0600. The scratch copy was removed; no value was printed.
- `npx prettier --check` passed on the changed files.

### Review round 1 (pull request 325)

- [x] Started: 2026-09-26T00:30:00Z
- [x] Completed: 2026-09-26T00:50:00Z
- [x] Automated verification: PASSED

**Notes**:

- The header is spelled `X-HOST-REVALIDATION-SECRET`, like `X-RBAC-SECRET-KEY` and `X-SPS-SKIP-ACTION-LOGGER`; the constant keeps its name. Both READMEs, the plan and the pull request description use the new spelling.
- The route spec sends the documented header name as a literal, and the middleware spec's first host-call case asserts the exact header key the API sends, so the specs pin the spelling rather than following the constant.
- The JSDoc of `revalidationSecretMatches` states why it repeats `rbacSecretMatches`: that helper is bound to `RBAC_SECRET_KEY`, a host route handler must not import `@sps/backend-utils` (#299), and `@sps/shared-utils` cannot use node built-ins.
- Specs: route 10, revalidation middleware 15, agent page cache 3, all passed.
- Mutations, each restored: the constant set back to `X-Host-Revalidation-Secret` → the middleware case fails and the route spec passes, because HTTP header names are case-insensitive; the constant set to `X-Revalidation-Token` → the three authorized route cases and the middleware case fail.

## Incident Log

> Read this section FIRST before starting any implementation work.
> Parallel agents: check here for known pitfalls before debugging independently.

<!-- incident-count: 3 -->

### Incident 1 — Mock call history leaked between describe blocks

- **Occurrences**: 1
- **Stage**: Phase 1 - Shared contract and host guard
- **Symptom**: two host scenarios in the second `describe` saw `revalidatePath` calls made by the first block.
- **Root Cause**: `jest.clearAllMocks()` ran only in the first block's `beforeEach`; the `next/cache` mock is a module-level `jest.fn()` shared by both blocks, and `restoreAllMocks` does not clear it.
- **Fix**: moved `beforeEach`/`afterEach` to file level.
- **Reusable Pattern**: when a module-factory mock serves several `describe` blocks, clear it in a file-level hook.

### Incident 2 — zsh history modifiers in `$var:word`

- **Occurrences**: 2
- **Stage**: Research (`git show $B:thoughts/...`) and Phase 2 (`nx run $p:eslint:lint`)
- **Symptom**: `fatal: ambiguous argument` from git, and `Cannot find project 'slint'` from nx, so both lint targets exited 1 without linting.
- **Root Cause**: in zsh `$B:t` and `$p:e` apply the tail and extension modifiers.
- **Fix**: wrote `${B}:path` and `${p}:eslint:lint`; the lint targets then passed.
- **Reusable Pattern**: always brace a variable followed by a colon in zsh.

### Incident 3 — zsh does not split an unquoted variable

- **Occurrences**: 1
- **Stage**: Phase 2 - type-check triage
- **Symptom**: a `for f in $files` loop reported one file instead of sixteen.
- **Root Cause**: zsh does not word-split unquoted parameter expansions.
- **Fix**: a `while IFS= read -r` loop over a file list.
- **Reusable Pattern**: iterate lists line by line in zsh, or use `${=var}`.

## Summary

### Changes Made

- Host route guard with a constant-time comparison and one 401 for every refusal; a host log warning when the secret is unset.
- Three API-side senders send `X-HOST-REVALIDATION-SECRET` and encode their query values; the middleware logs refused and failed calls.
- The API boot report names the variable when it is missing or short.
- Local bootstrap, deployer templates and scripts, and both GitHub secret lists carry one value to the API and the host.
- Deployer and revalidation READMEs document the contract, rotation and the upgrade step.

### Commits

- `5315f887e8` fix(host): require a shared secret on the revalidation route
- `776188d73c` docs(thoughts): record issue 315 research, plan and implementation

### Pull Request

- [x] PR created: https://github.com/singlepagestartup/singlepagestartup/pull/325
- [x] PR number: 325 (description in `thoughts/shared/prs/325_description.md`)

### Final Status

- [x] All phases completed
- [x] All automated verification passed
- [ ] Issue marked as Done

---

**Last updated**: 2026-09-26T00:10:00Z
