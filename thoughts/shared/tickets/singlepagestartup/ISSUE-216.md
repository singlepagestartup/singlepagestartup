---
repository: singlepagestartup
issue_number: 216
status: Research Needed
created: 2026-07-21
---

# Issue: Remove temporary natural-key repair after SPS rollout

## Metadata

**URL**: https://github.com/singlepagestartup/singlepagestartup/issues/216
**Status**: Research Needed
**Created**: 2026-07-21
**Priority**: medium
**Size**: medium
**Type**: refactoring

---

## Problem to Solve

The natural-key constraint rollout requires a temporary deployment-time repair command so existing SinglePageStartup installations can normalize legacy duplicate identities, subject links, Telegram chats, default/topic threads, Telegram profiles, and automatic profile-to-chat links before the new unique constraints are applied.

The repair belongs to migration compatibility rather than the steady-state request path. After every project based on SinglePageStartup has upgraded to the release containing the repair and constraints and has successfully completed its migrations, keeping this compatibility code would add permanent maintenance cost for a historical state that the database can no longer produce.

## Key Details

- Do not start removal until every maintained downstream project has upgraded to the applicable SinglePageStartup version and completed database migrations.
- Until that gate is reached, every API deployment/restart must run the repair before Social and RBAC unique-index migrations. The canonical Docker/Swarm path is `start.sh api` -> foreground `migrate.sh seed` -> `repository-natural-key-repair-apply`; migration or repair failure must prevent the new API task from starting.
- Maintain a rollout inventory with one row per maintained downstream project and environment. For each row, record the deployed compatibility version, deployment timestamp, migration result, repair log evidence, and post-deployment check result.
- Confirm the deployment log contains a successful `RBAC_NATURAL_KEY_REPAIR` event and no `RBAC_NATURAL_KEY_REPAIR_FAILED` event. Then run `npx nx run @sps/rbac:repository-natural-key-repair-check` against that environment and require exit code `0`, `skipped=false` on an existing installation, and zero duplicate/conflict counts in every `identity`, `telegram`, and `grants` `after` result.
- Verify the generated natural-key indexes exist in PostgreSQL and inspect API/Telegram logs after rollout for unique-constraint retry loops, Telegram bootstrap/profile ownership errors, authorization errors, and migration failures.
- Smoke-test two rapid `/start` messages for one Telegram account: both updates are processed independently, and the resulting database graph still has one provider identity owner, one Telegram chat/profile, one default thread, and one topic thread per Telegram topic natural key.
- Remove the temporary identity, subjects-to-identities, Telegram chat, default/topic thread, Telegram profile, and automatic profile-link repair implementations from `repository-natural-key-repair-apply`.
- Remove temporary repair-only command wiring, diagnostics, data types, and tests that no longer protect an upgrade path.
- Delete the deployment-only repair implementations and runners under `libs/modules/rbac/backend/repository/database/src/lib/`: `identity-natural-key-repair.ts`, `telegram-natural-key-repair.ts`, `natural-key-repair.ts`, `repair-natural-keys.ts`, and their integration tests.
- Remove `repository-natural-key-repair-check` / `repository-natural-key-repair-apply` target wiring and the pre-Social invocations from `apps/api/project.json` and `migrate.sh`; restore aggregate repository migration targets to migration-only execution. Keep deployment migrations foreground/fail-fast unless a separate reviewed change intentionally revises that policy.
- Remove the temporary rollout instructions and ID diagnostics from RBAC documentation after confirming they are no longer needed operationally.
- Keep all generated migrations and permanent unique/partial unique constraints.
- Keep normal request handling for incomplete identity graphs: a later request may create a subject/link when an identity has no subject relation.
- Verify both a fresh database and a database already upgraded through the compatibility release migrate successfully after the cleanup. Repeat the rapid `/start` smoke test and confirm the same database cardinalities and absence of the listed log errors.

## Implementation Notes

Treat the compatibility release version as the removal gate. Record the version and complete the downstream rollout inventory before deleting code. The absence of reported errors alone is not enough: every maintained database must have explicit successful repair/check evidence. The cleanup must not weaken the permanent provider-specific identity constraints, the unique identity ownership relation, or the Telegram chat/thread/profile natural keys introduced by the preceding change.

## References

- Follow-up to #213 and the Telegram/RBAC natural-key constraint simplification (#211).
- Research: `thoughts/shared/research/singlepagestartup/ISSUE-216.md`

## Comments

### flakecode, 2026-07-21T20:59:45Z

Implementation scope clarified during the compatibility change:

- Remove `identity-natural-key-repair.ts`, `telegram-natural-key-repair.ts`, the earlier grant `natural-key-repair.ts`, `repair-natural-keys.ts`, and the repair-only integration tests after every downstream database has migrated.
- Remove `repository-natural-key-repair-check` / `repository-natural-key-repair-apply`, including the pre-Social invocation in `apps/api/project.json` and the repair call nested in the aggregate RBAC migration.
- Remove the temporary rollout instructions and the identity/link/subject diagnostics.
- Retain all generated migrations, provider-specific identity constraints, identity ownership uniqueness, Telegram chat/default-thread constraints, relation-pair constraints, and ordinary runtime bootstrap behavior.

Removal remains gated on recording the compatibility release version and verifying rollout/migration completion for every maintained downstream project.

### flakecode, 2026-07-21T21:09:57Z (original in Russian; English summary)

Defines the mandatory contract of the temporary repair and the criteria for removing it.

**How the repair must reach every project**

- While this issue is open, every API deployment/restart must run `start.sh api` -> foreground `migrate.sh seed` -> `@sps/rbac:repository-natural-key-repair-apply`.
- Apply runs before the Social and RBAC natural-key migrations. `RBAC_NATURAL_KEY_REPAIR_FAILED`, any migration failure, or a seed failure must fail the new API task; a new API version must not start on top of a partially upgraded database.
- The call stays in the production `migrate.sh`, in `apps/api/project.json` for `api:db:migrate`, and in the aggregate `@sps/rbac:repository-migrate` until every maintained SPS project has completed the rollout. Repeated apply is idempotent.

**Where to record rollout completion**

Before removal, add a table to this issue with one row per project and environment: SPS compatibility version, deployment time, migration result, repair log link or fragment, and post-deployment check result. Absence of complaints without such a record does not count as confirmation.

**How to verify each database**

1. Find a successful `RBAC_NATURAL_KEY_REPAIR` entry with `mode=apply` in the deployment log; confirm there is no `RBAC_NATURAL_KEY_REPAIR_FAILED` and no migration/seed failure after it.
2. Run `npx nx run @sps/rbac:repository-natural-key-repair-check` with the environment of the API under review. Require exit code `0`, `skipped=false` for an existing installation, and zero duplicate/conflict counts in every `identity`, `telegram`, and `grants` section of the `after` result.
3. Confirm through PostgreSQL `pg_indexes` that the generated provider-specific identity, identity-owner, Telegram chat/default-thread, and relation-pair unique indexes exist.
4. Review API/Telegram logs after deployment: no unique-constraint error loops, no `telegram/bootstrap: telegram-bot system social.profile was not found`, no ownership/authorization errors (`Requested social-module chat does not belong to profile`), and no migration failures.
5. Send two `/start` messages in quick succession from one Telegram account. Both updates are processed independently; the database keeps one provider identity with one subject owner, one Telegram chat/profile, one default thread, and one topic thread per Telegram topic natural key.

**What to delete only after confirmed rollout**

- `identity-natural-key-repair.ts`, `telegram-natural-key-repair.ts`, `natural-key-repair.ts`, `repair-natural-keys.ts`, and the repair-only integration tests.
- `repository-natural-key-repair-check` / `repository-natural-key-repair-apply` and their calls from `migrate.sh`, `apps/api/project.json`, and the aggregate RBAC migrate.
- The temporary rollout documentation and diagnostic types.

Generated migrations and permanent constraints remain. After removal, separately verify migration of a fresh database and of an already upgraded database, then repeat the `/start` smoke test and the log review.
