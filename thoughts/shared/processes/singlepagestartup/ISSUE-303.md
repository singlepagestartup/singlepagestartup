---
issue_number: 303
issue_title: "Review the permission default for routes without roles"
repository: singlepagestartup
created_at: 2026-09-25T00:00:00Z
last_updated: 2026-09-26T01:05:00Z
status: active
current_phase: complete
---

# Process Log: ISSUE-303 - Review the permission default for routes without roles

## Purpose

Tracks cross-phase execution notes, incidents, reusable fixes, and workflow learnings.

## Phase Status

- Create: completed
- Research: completed
- Plan: completed
- Implement: completed
- Current phase: complete
- Next step: code review of PR #346 by the lead, then merge

## Phase Notes

### Create

- Summary: raised by the 2026-09-25 security review (`thoughts/shared/research/singlepagestartup/2026-09-25-security-review.md`), findings N-02, SEC-19, SEC-33. The issue is under embargo: neutral public title, detail only in the local ticket.
- Incidents: none.

### Research

- Summary: verified the role-less rule, the seed inventory (475 permissions, 322 role-less, 29 to move to Admin), every caller of those rows, the owner-checked order routes and the dump flow. The cart depends on two order variants and on subject variants that refetch by id; the subject refetch is already refused for non-admins on `main`. Findings outside the scope go to the lead's report only.
- Outputs: `thoughts/shared/research/singlepagestartup/ISSUE-303.md`.
- Notes: research ran in the issue worktree with a throwaway database `sps-lite-issue-303` on the local PostgreSQL and an API on port 4303; the worktree's own `apps/api/.env` copy pointed at that database during the runs and was restored afterwards.

### Plan

- Summary: four phases: cart reads through the owner route (including the two order variants and the subject parent), Admin role on 29 seed rows by dump from a copy of the development database, a reviewed list of role-less rows beside the seed with a check in the rbac unit lane, and the owner middleware on `openrouter/models`. Plan approval is delegated to the issue agent for this wave.
- Outputs: `thoughts/shared/plans/singlepagestartup/ISSUE-303.md`.
- Notes: the order list widget and the two order variants are additions to the ticket's step 1, needed so the cart and order list keep working once module-level order reads require the Admin role.

### Implement

- Summary: all four phases done; the seed phase ran first while the API already served the copy of the development database. Unit lanes, lint, type checks, the placement check and the HTTP run passed; the issue-152 scenario lane could not run (incident 5).
- Outputs: progress file `thoughts/shared/handoffs/singlepagestartup/ISSUE-303-progress.md`; PR https://github.com/singlepagestartup/singlepagestartup/pull/346 with description `thoughts/shared/prs/346_description.md`.
- Notes: the throwaway database was dropped and the worktree env copy restored after the HTTP run.

## Incident Log

> Record only substantive incidents: debugging sessions, wrong assumptions, tool friction, helper failures, workflow gaps, or repeated recoveries.

<!-- incident-count: 5 -->

### Incident 1 — Seeding a fresh database cannot reproduce snapshot ids

- **Phase**: Research
- **Occurrences**: 1
- **Symptom**: after seeding a throwaway database from the snapshots, `npx nx run api:db:dump` deleted 1054 snapshot files and wrote 1053 files with new names.
- **Root Cause**: the repository `insert` deletes `data.id` before inserting (`libs/shared/backend/api/src/lib/repository/database/index.ts:184-188`), so every seeded row gets a new id; relation files dumped from such a database reference ids no snapshot has.
- **Fix**: restored the snapshot files, then rebuilt the throwaway database as a `pg_dump` copy of the shared development database, whose rbac id sets equal the snapshots; a dump of that copy reproduces the rbac data directories byte for byte.
- **Preventive Action**: change seed rows on a copy of the database the snapshots were dumped from, never on a database seeded from the snapshots; compare id sets first.
- **References**: `apps/api/src/db/dump.ts`, `apps/api/src/db/seed.ts`, `libs/shared/backend/api/src/lib/repository/database/index.ts`.

### Incident 2 — `api:db:migrate` fails on the nested repair target

- **Phase**: Research
- **Occurrences**: 1
- **Symptom**: `npx nx run api:db:migrate` stopped at `@sps/rbac:repository-natural-key-repair-apply` with `ENOENT: no such file or directory, open 'apps/api/.env'`.
- **Root Cause**: `api:db:migrate` runs with `cwd: apps/api`, and the nested target's relative `envFile: apps/api/.env` does not resolve from there.
- **Fix**: ran `bash migrate.sh` from the repository root, which is the deploy path and runs the same chain.
- **Preventive Action**: migrate a local or throwaway database with `bash migrate.sh` from the root.
- **References**: `apps/api/project.json` (`db:migrate`), `libs/modules/rbac/project.json` (`repository-natural-key-repair-apply`), `migrate.sh`.

### Incident 3 — Order variant specs fail to load through the package entry

- **Phase**: Implement
- **Occurrences**: 1
- **Symptom**: `This module cannot be imported from a Client Component module` when a spec imported `@sps/ecommerce/models/order/frontend/component`.
- **Root Cause**: the package dispatcher imports every variant; some server halves import `server-only`.
- **Fix**: `jest.mock("server-only", () => ({}), { virtual: true })`.
- **Preventive Action**: mock `server-only` in jsdom specs that import a component package entry or a variant `index.tsx`.
- **References**: `libs/shared/frontend/components/src/lib/singlepage/admin-v2/card/server.spec.tsx:22`.

### Incident 4 — Lint failed on the formatting of two new specs

- **Phase**: Implement
- **Occurrences**: 1
- **Symptom**: `prettier/prettier` errors in two new spec files.
- **Root Cause**: files written without running Prettier.
- **Fix**: `npx prettier --write` over the changed files; lint passed.
- **Preventive Action**: run Prettier on new files before the lint target.
- **References**: progress file, Verification.

### Incident 5 — The issue-152 scenario lane cannot run here

- **Phase**: Implement
- **Occurrences**: 1
- **Symptom**: scenario preflight: `GET /api/http-cache/clear` 404 without `MIDDLEWARE_HTTP_CACHE=true`, 500 with it.
- **Root Cause**: the Redis on port 6384 rejects the password in this checkout's `apps/api/.env` (`WRONGPASS`), and the HTTP cache needs it.
- **Fix**: none in scope; unit specs and the HTTP run cover the cart path.
- **Preventive Action**: check the API log for `KV connection error` before relying on the scenario lane.
- **References**: `tools/testing/test-scenario-issue.sh`.

## Reusable Learnings

- Change seed rows on a copy of the database the snapshots were dumped from; a database seeded from the snapshots gets new ids.
- A browser component that renders data read through an owner-checked subject route must not use a variant whose parent refetches the row by id through the module route.
