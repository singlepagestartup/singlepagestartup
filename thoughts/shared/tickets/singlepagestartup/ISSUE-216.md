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
