---
date: 2026-09-18T02:15:41+03:00
researcher: flakecode
git_commit: 29370bcbf85b195fbd1c2422707141135184d6e0
branch: worktree-issues-2026-09-18
repository: singlepagestartup
topic: "Remove temporary natural-key repair after SPS rollout"
tags: [research, codebase, rbac, social, telegram, migrations, natural-keys, deployment]
status: complete
last_updated: 2026-09-18
last_updated_by: flakecode
---

# Research: Remove temporary natural-key repair after SPS rollout

**Date**: 2026-09-18T02:15:41+03:00
**Researcher**: flakecode
**Git Commit**: 29370bcbf85b195fbd1c2422707141135184d6e0
**Branch**: worktree-issues-2026-09-18
**Repository**: singlepagestartup

## Research Question

Issue #216 asks for the temporary deployment-time natural-key repair to be removed once every maintained downstream SinglePageStartup project has upgraded through the compatibility release and completed its migrations. This research documents, as the code stands today:

1. the complete inventory of temporary repair code, tests, Nx targets, script invocations, log markers, and documentation that the issue scopes for removal;
2. the permanent unique and partial-unique constraints and generated migrations that the issue says must stay;
3. the runtime bootstrap behavior that must remain after the cleanup;
4. the release history of the repair and what "compatibility release version" resolves to in git;
5. what removal-gate evidence the issue requires and whether any of it exists in the repository;
6. every load-bearing claim in the issue and its two comments, verified against live code, with contradictions recorded.

## Summary

The temporary repair is one Bun entry point plus three repair modules under `libs/modules/rbac/backend/repository/database/src/lib/`. `repair-natural-keys.ts` runs identity, Telegram, and grant repair in sequence, logs `RBAC_NATURAL_KEY_REPAIR` on success and `RBAC_NATURAL_KEY_REPAIR_FAILED` on failure, and exits `0` or `1` (`repair-natural-keys.ts:27-55`). The three modules share the `NaturalKeyRepairMode` type exported from `natural-key-repair.ts:4`, so they form one deletion unit together with the two repair-only integration specs (`natural-key-repair.integration.spec.ts`, `temporary-natural-key-repair.integration.spec.ts`). Two permanent contract tests that inspect Drizzle metadata (`natural-key-constraints.spec.ts` in RBAC and `libs/modules/social/natural-key-constraints.spec.ts`) do not depend on the repair modules.

The repair is wired in four places: the `repository-natural-key-repair-check` / `-apply` targets (`libs/modules/rbac/project.json:56-71`), the last step of the aggregate `@sps/rbac:repository-migrate` (`libs/modules/rbac/project.json:50-52`), the pre-Social step of `api:db:migrate` (`apps/api/project.json:108`), and the pre-Social step of the production `migrate.sh` (`migrate.sh:15`). `up.sh:10` and the `api:prepare` target (`apps/api/project.json:166`) reach the repair through `api:db:migrate`; the Swarm API service reaches it through `start.sh api` (`tools/deployer/api/docker-compose.api.yaml.j2:12`).

Two statements in the issue and the RBAC README are contradicted by live code. First, `start.sh:12` runs `./migrate.sh seed &` in the background, so `npm run api:start` on line 13 starts regardless of migration or repair outcome; commit `ecf319e3bf` (2026-07-22 12:02 +0300, tag `0.0.292`) made that change roughly twelve hours after the issue comment that mandated foreground execution, and `libs/modules/rbac/README.md:117-122` still describes the foreground policy. Second, `libs/modules/rbac/README.md:131-133` says the aggregate target runs repair before migrations, but commit `53b059643c` (2026-07-25, first tag `0.0.295`) moved the apply step to the end of `@sps/rbac:repository-migrate`.

The permanent constraints are fourteen named unique or partial-unique indexes across six RBAC and seven Social repository packages, each declared in `constraints/singlepage.ts`, composed through `constraints/startup.ts` and `constraints/index.ts`, and materialized by generated migrations listed in the Detailed Findings. The identity package additionally carries a migration pair that creates and then drops `sps_rc_identity_email_email_unique` (`0001_purple_dorian_gray.sql:5`, `0002_late_power_man.sql:1`).

No release is recorded anywhere in the repository as "the compatibility release". The root `package.json` has no `version` field; releases are git tags of the form `0.0.NNN`. The grant repair first appears in `0.0.290` (2026-07-21), the identity/Telegram repair and the `migrate.sh` / `api:db:migrate` wiring in `0.0.291` (2026-07-22), and the final identity-index reconciliation and aggregate reorder in `0.0.295` (2026-07-28). The newest tag is `0.0.302` (2026-08-14). Neither the issue nor its comments record a version, and no rollout inventory, repair-log excerpt, check output, `pg_indexes` result, or `/start` smoke-test record exists in the issue, in `thoughts/`, in `tools/deployer/`, or elsewhere in the repository.

## Detailed Findings

### Repair entry point and log markers

- `libs/modules/rbac/backend/repository/database/src/lib/repair-natural-keys.ts:13-19` selects `apply` when `--apply` is present on `process.argv`, otherwise `check`.
- `repair-natural-keys.ts:27-33` executes `repairIdentityNaturalKeys`, then `repairTelegramNaturalKeys`, then `repairRbacNaturalKeys`, each with the same mode, and each as its own transaction.
- `repair-natural-keys.ts:35-43` emits `logger.info("RBAC_NATURAL_KEY_REPAIR", JSON.stringify({ mode, identity, telegram, grants }))`. The `identity` payload includes the `diagnostics` object described below; the `telegram` and `grants` payloads carry only counts and change totals.
- `repair-natural-keys.ts:45-46` closes the postgres client and exits `0`; `repair-natural-keys.ts:47-55` logs `logger.error("RBAC_NATURAL_KEY_REPAIR_FAILED", error)` and exits `1`.
- The `logger` is the `@sps/backend-utils` provider switch (`libs/shared/backend/utils/src/lib/logger/index.ts:10-18`); under `pino` the marker string is the first positional argument to `logger.info` (`libs/shared/backend/utils/src/lib/logger/providers/pino.ts:16-18`).
- The two marker strings occur nowhere else in the codebase outside `thoughts/`.

### Grant repair (`natural-key-repair.ts`, 401 lines)

- `natural-key-repair.ts:4` exports `NaturalKeyRepairMode = "check" | "apply"`; `identity-natural-key-repair.ts:3` and `telegram-natural-key-repair.ts:3` import it.
- `natural-key-repair.ts:6-41` declares the table-name, duplicate-count, change-count, result, and props interfaces; `:64-68` defaults to `sps_rc_permission`, `sps_rc_rs_to_ps_mz2`, `sps_rc_ss_to_rs_3nw`.
- `natural-key-repair.ts:105-138` checks table availability with `to_regclass` and throws when only some of the three tables exist.
- `natural-key-repair.ts:140-209` builds the inspection query: canonical rows are the earliest by `(created_at ASC, id ASC)`; role-permission duplicates are counted after normalizing to the canonical permission; groups whose `condition` values disagree are counted as conflicts.
- `natural-key-repair.ts:238-347` is the apply path: `LOCK TABLE ... IN SHARE ROW EXCLUSIVE MODE` (`:244-246`), abort on condition conflicts (`:250-254`), delete duplicate role-permission rows (`:256-282`), repoint remaining role-permission rows to the canonical permission (`:284-302`), delete duplicate permissions (`:304-319`), delete duplicate subject-role rows (`:321-336`).
- `natural-key-repair.ts:349-401` is the exported function: `skipped: true` when the permission table is absent (`:358-366`); check mode runs the inspection inside a `repeatable read read only` transaction (`:368-381`); apply mode re-inspects after the changes and throws if any duplicates or conflicts remain (`:383-400`).

### Identity repair and ID diagnostics (`identity-natural-key-repair.ts`, 617 lines)

- `identity-natural-key-repair.ts:5-48` declares counts, changes, and the diagnostic types `IIdentityNaturalKeyGroupDiagnostic` (`:18-26`: provider, canonical identity id, retained link and subject ids, duplicate identity ids, deleted link ids, detached subject ids) and `IIdentityOwnershipDiagnostic` (`:28-34`). The result type carries `diagnostics` (`:47`). These are the "identity/link/subject diagnostics" and "diagnostic types" named in the issue comments.
- `identity-natural-key-repair.ts:100-103` defaults to `sps_rc_identity` and `sps_rc_ss_to_is_h58`; `:105-126` requires both tables or neither.
- `identity-natural-key-repair.ts:128-172` defines the natural key: exact `account` for `telegram` and `oauth_google`, `lower(account)` for `ethereum_virtual_machine`, `lower(email)` for `email_and_password`, and `NULL` for every other provider including plain `email` (`:134-142`). Link duplicates are counted per `iy_id` (`:152-157`).
- `identity-natural-key-repair.ts:188-395` computes the diagnostics: which identity in each duplicate group is canonical, which links are retained or deleted, and which subjects become detached.
- `identity-natural-key-repair.ts:397-551` is the apply path. Unlike the grant repair, the canonical identity is the newest by `(created_at DESC, id DESC)` (`:419-431`). It deletes non-canonical group links (`:405-453`), repoints remaining links to the canonical identity (`:455-491`), deletes duplicate identities (`:493-527`), then deletes extra ownership links so each identity keeps its newest link (`:529-544`).
- `identity-natural-key-repair.ts:553-617` mirrors the grant function: skip (`:561-570`), read-only check with diagnostics (`:572-589`), apply with a convergence assertion (`:591-616`).

### Telegram graph repair (`telegram-natural-key-repair.ts`, 715 lines)

- `telegram-natural-key-repair.ts:48-76` names twelve tables: `sps_rc_identity`, `sps_rc_ss_to_is_h58`, `rc_ss_to_sl_me_ps_ges`, `sl_profile`, `sl_chat`, `sl_thread`, `sl_ps_to_cs_m2s`, `sl_cs_to_ts_v33`, `sl_cs_to_ms_e6r`, `sl_cs_to_as_b9b`, `sl_ts_to_ms_2n4`, `sl_ts_to_as_4vv`.
- `telegram-natural-key-repair.ts:100-142` returns "skip" when none of the three RBAC prerequisite tables exist; the inline comment at `:121-122` records that Social migrations run before RBAC on a fresh database. Partial availability throws with the missing table names.
- `telegram-natural-key-repair.ts:156-243` counts duplicate Telegram chats by `source_system_id`, duplicate Telegram profiles per subject, duplicate default threads per chat, duplicate topic threads per `(chat, source_system_id)`, duplicate pairs across the seven relation tables, and stale `telegram-personal-ai-agent` links whose profile slug does not match `telegram-personal-ai-agent-<subject id>` (`:204-218`).
- `telegram-natural-key-repair.ts:359-657` is the apply path. It locks all twelve tables (`:363-367`), builds temp maps that prefer the deterministic slugs `telegram-chat-<source_system_id>` (`:369-383`), `telegram-thread-<chat>-default` / `telegram-thread-<chat>-<topic>` (`:404-443`), and `telegram-profile-<subject>` (`:474-491`), copies relations to the canonical entity, deletes relations and entities of the losers, rewrites canonical slugs, sets the chats-to-threads `variant` (`:601-611`), deletes stale personal-AI links (`:613-630`), and finally deduplicates every relation pair (`:632-647`).
- `telegram-natural-key-repair.ts:663-715` follows the same skip / check / apply-with-convergence shape.

### Repair-only tests and the permanent contract tests

- `natural-key-repair.integration.spec.ts` (285 lines) creates randomly named temporary tables (`:25-33`) and covers two scenarios: convergence and idempotent rerun on equivalent duplicates (`:150-239`), and rollback without data loss on conflicting conditions (`:241-285`).
- `temporary-natural-key-repair.integration.spec.ts` (605 lines) covers duplicate provider identities (`:284-471`: repeated checkout contact emails are preserved, the newest identity wins idempotently, the older ownership link is reported and removed), duplicate Telegram chats/profiles/threads (`:473-560`), and the fresh-database skip (`:562-605`).
- Both specs are selected by `libs/modules/rbac/jest.integration.config.ts:4` (`testMatch: ["<rootDir>/**/*.integration.spec.ts"]`) and excluded from the unit target by `libs/modules/rbac/jest.config.ts:4-5`.
- `libs/modules/rbac/backend/repository/database/src/lib/natural-key-constraints.spec.ts` (179 lines) imports only repository tables and field compositions (`:9-25`) and asserts seven properties of the composed Drizzle metadata (`:69-173`), including the identity partial keys, the one-owner-per-identity index, and the three grant keys.
- `libs/modules/social/natural-key-constraints.spec.ts` asserts the Telegram chat source-id key (`:48`), the relation pair keys (`:62`), and the one-default-thread-per-chat key (`:100`). Both contract tests were introduced in the same commits as the repair but have no import of any repair module.

### Nx targets and script invocations

- `libs/modules/rbac/project.json:56-63` defines `repository-natural-key-repair-check` (`envFile: apps/api/.env` at `:60`, `bun run .../repair-natural-keys.ts --check` at `:61`); `:64-71` defines `repository-natural-key-repair-apply` with `--apply` (`:69`).
- `libs/modules/rbac/project.json:38-55` defines the aggregate `repository-migrate` as models (`:45`), relations (`:48`), then `repository-natural-key-repair-apply` (`:51`), with `parallel: false` and `cache: false`.
- `apps/api/project.json:76-133` defines `api:db:migrate`; the apply step is at `:108`, after `@sps/knowledge` (`:105`) and before `@sps/social:repository-migrate` (`:111`) and `@sps/rbac:repository-migrate` (`:120`). The `prepare` target invokes `api:db:migrate` (`:160-170`, command at `:166`), and `up.sh:10` invokes it for local bootstrap.
- `migrate.sh:3` sets `set -euo pipefail`; the apply step is `migrate.sh:15`, before `@sps/social` (`:18`) and `@sps/rbac` (`:19`); `migrate.sh:25-27` runs `api:db:seed` when the first argument is `seed`.
- `start.sh:3` sets `set -euo pipefail`; the `api` branch (`:10-14`) runs `./create_env.sh api deployment`, then `./migrate.sh seed &` (`:12`), then `npm run api:start` (`:13`).
- `Dockerfile:59-60` marks `migrate.sh` and `start.sh` executable; the image `CMD` is `tail -f /dev/null`, so the entry command comes from the compose template. `tools/deployer/api/docker-compose.api.yaml.j2:12` runs `sh -c './start.sh api'` and `:19-20` sets `update_config.order: start-first`. The root `docker-compose.yaml:33` only starts `host`.
- `tools/deployer/` (137 files, including `api.sh` and `README.md`) contains no reference to `migrate`, `repair`, or the natural-key rollout.

### Deployment execution order today

Because `start.sh:12` backgrounds `migrate.sh`, the sequence on a Swarm API task is: environment file creation, migration job launched in the background (with the repair as its ninth step), API process started immediately. `set -euo pipefail` in `start.sh` does not propagate the exit status of a backgrounded job, and `start-first` in the Swarm template means the previous task keeps serving until the new one is running. Within the background job, `migrate.sh:3` stops the job at the first failing step, so a repair failure prevents the later Social and RBAC natural-key migrations from running in that job but does not stop the already-started API process.

### Permanent constraints and generated migrations

Every repository below declares its index in `constraints/singlepage.ts`, re-exports it unchanged through `constraints/startup.ts:8-10` and `constraints/index.ts:1`, and composes it in `schema.ts:15`.

| Repository                                          | Index name                                                                                                 | Declaration                       | Migration                                                                    |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | --------------------------------- | ---------------------------------------------------------------------------- |
| `rbac/models/identity`                              | `sps_rc_identity_telegram_account_unique` (partial: `provider = 'telegram' AND account IS NOT NULL`)       | `constraints/singlepage.ts:14-19` | `migrations/0001_purple_dorian_gray.sql:1`                                   |
| `rbac/models/identity`                              | `sps_rc_identity_oauth_google_account_unique` (partial)                                                    | `constraints/singlepage.ts:20-25` | `0001_purple_dorian_gray.sql:2`                                              |
| `rbac/models/identity`                              | `sps_rc_identity_evm_account_unique` (on `lower(account)`, partial)                                        | `constraints/singlepage.ts:26-31` | `0001_purple_dorian_gray.sql:3`                                              |
| `rbac/models/identity`                              | `sps_rc_identity_email_password_email_unique` (on `lower(email)`, partial)                                 | `constraints/singlepage.ts:32-37` | `0001_purple_dorian_gray.sql:4`                                              |
| `rbac/models/identity`                              | `sps_rc_identity_email_email_unique` (created, then dropped)                                               | not declared today                | created `0001_purple_dorian_gray.sql:5`, dropped `0002_late_power_man.sql:1` |
| `rbac/models/permission`                            | `sps_rc_permission_type_method_path_unique`                                                                | `constraints/singlepage.ts:13-15` | `0002_confused_famine.sql:1`                                                 |
| `rbac/relations/subjects-to-identities`             | `sps_rc_subject_identity_identity_unique` (on `iy_id`)                                                     | `constraints/singlepage.ts:11-13` | `0001_loving_sleeper.sql:1`                                                  |
| `rbac/relations/roles-to-permissions`               | `sps_rc_role_permission_unique`                                                                            | `constraints/singlepage.ts:12-14` | `0002_bumpy_the_executioner.sql:1`                                           |
| `rbac/relations/subjects-to-roles`                  | `sps_rc_subject_role_unique`                                                                               | `constraints/singlepage.ts:12-14` | `0001_thankful_leader.sql:1`                                                 |
| `rbac/relations/subjects-to-social-module-profiles` | `sps_rc_subject_social_profile_unique`                                                                     | `constraints/singlepage.ts:13-15` | `0001_greedy_cobalt_man.sql:1`                                               |
| `social/models/chat`                                | `sl_chat_telegram_source_system_unique` (partial: `variant = 'telegram' AND source_system_id IS NOT NULL`) | `constraints/singlepage.ts:13-18` | `0002_yummy_grandmaster.sql:1`                                               |
| `social/relations/chats-to-threads`                 | `sl_chat_thread_unique`                                                                                    | `constraints/singlepage.ts:14-16` | `0001_unique_scarlet_witch.sql:1`                                            |
| `social/relations/chats-to-threads`                 | `sl_chat_default_thread_unique` (partial: `variant = 'default'`)                                           | `constraints/singlepage.ts:17-20` | `0001_unique_scarlet_witch.sql:2`                                            |
| `social/relations/profiles-to-chats`                | `sl_profile_chat_unique`                                                                                   | `constraints/singlepage.ts:12-14` | `0001_dusty_katie_power.sql:1`                                               |
| `social/relations/chats-to-messages`                | `sl_chat_message_unique`                                                                                   | `constraints/singlepage.ts:10-12` | `0002_goofy_paibok.sql:1`                                                    |
| `social/relations/chats-to-actions`                 | `sl_chat_action_unique`                                                                                    | `constraints/singlepage.ts:10-12` | `0001_dusty_doctor_octopus.sql:1`                                            |
| `social/relations/threads-to-messages`              | `sl_thread_message_unique`                                                                                 | `constraints/singlepage.ts:10-12` | `0001_demonic_the_captain.sql:1`                                             |
| `social/relations/threads-to-actions`               | `sl_thread_action_unique`                                                                                  | `constraints/singlepage.ts:10-12` | `0001_conscious_ares.sql:1`                                                  |

All paths are relative to `libs/modules/<module>/<models|relations>/<name>/backend/repository/database/src/lib/`. The `subject`, `thread`, and `profile` model repositories have no `constraints/` directory and no unique index beyond their primary key. Each package's `migrations/meta/_journal.json` lists the corresponding tag (for example `0001_purple_dorian_gray` and `0002_late_power_man` for identity). The identity natural key used by the repair (`identity-natural-key-repair.ts:134-142`) matches the four indexes that remain declared: plain `email` provider rows are excluded from both.

### Runtime behavior the issue says to keep

- `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/telegram/bootstrap.ts:825-830` throws `Data integrity error. Multiple Telegram identities found for one account` when more than one Telegram identity matches; `:833-852` loads the identity's subject links and throws `Data integrity error. Identity is linked to multiple subjects` on more than one link.
- `bootstrap.ts:863-876` handles an identity that has no subject link by creating a subject and a `subjects-to-identities` relation. This is the "later request may create the missing subject/link" behavior the issue retains.
- `bootstrap.ts:877-900` creates identity, subject, and link for a new account and sets `registration = true`.
- The only "repair" identifiers left in `bootstrap.ts` (1,163 lines) concern topic title normalization (`:334-355`). The file contains no duplicate-identity, duplicate-profile, or duplicate-relation merge routine; the unit spec documents the current behavior as `Required profiles are connected without runtime cleanup` (`bootstrap.spec.ts:549-556`).
- `libs/modules/rbac/README.md:107-113` states that bootstrap and free-subscription provisioning do not use application or advisory locks. `libs/shared/backend/database/config/src/lib/` contains `migrate/`, `postgres.ts`, and `transform-many-to-many-relations` only; no `advisory-lock.ts` exists, and no file under the Telegram service directory references advisory locks.
- The two log strings the issue's verification step names are `telegram/bootstrap: telegram-bot system social.profile was not found` (`bootstrap.ts:715`) and `Authorization error. Requested social-module chat does not belong to profile` (`.../profile/find-by-id/chat/find-by-id/message/find.ts:198`, `message/create.ts:769`, `message/react-by-openrouter.ts:1883`, `.../thread/find-by-id/skill/find-by-id/run.ts:249`).

### Documentation that describes the rollout

- `libs/modules/rbac/README.md:80-113` ("Natural-key integrity and concurrent Telegram bootstrap") lists the grant, identity, and Telegram natural keys and the `constraints/singlepage -> startup -> index` composition. This section describes permanent behavior.
- `libs/modules/rbac/README.md:115-147` ("Repair and rollout") is the temporary section. `:117-122` states that `start.sh api` runs `migrate.sh seed` in the foreground and that a failure must stop the new API process; `:124-135` gives the six-step manual sequence (quiesce, check, investigate conflicts, apply, migrate, re-check); `:131-133` states that the aggregate target runs repair before migrations; `:137-147` describes what the repair normalizes, which IDs it logs, and that the code is removed only after the rollout tracked by issue #216.
- Per-entity READMEs describe the permanent keys and mention "repair" only as one of the coordinated changes required when a startup replaces a key: `libs/modules/rbac/models/identity/README.md:20-30`, `libs/modules/rbac/models/permission/README.md:17-23`, `libs/modules/rbac/relations/roles-to-permissions/README.md:19-25`, `libs/modules/rbac/relations/subjects-to-roles/README.md:18-24`, `libs/modules/rbac/relations/subjects-to-identities/README.md:18-19`, `libs/modules/social/models/chat/README.md:20-22`, `libs/modules/social/relations/chats-to-threads/README.md:18-19`.
- No file under `tools/`, `apps/`, `docs/`, `.agents/`, or the repository root mentions the repair, the rollout, or a compatibility version. There is no `CHANGELOG` file.

### Release history and the compatibility version

The root `package.json` has no `version` field; `apps/api/package.json:3` is a fixed `1.0.0`. Releases are git tags `0.0.NNN`. The repair and constraint history is:

| Commit       | Date                   | Content                                                                                                                                                                                                                                                                                                                                                                                                                                                       | First tag containing it                           |
| ------------ | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| `0d5af32d28` | 2026-07-20             | Grant repair, runner, RBAC contract test, permission / roles-to-permissions / subjects-to-roles constraints and migrations, README, check/apply targets (#211)                                                                                                                                                                                                                                                                                                | `0.0.290` (2026-07-21)                            |
| `acd723fcc3` | 2026-07-21             | `fields/startup` composition and README updates for the three grant repositories                                                                                                                                                                                                                                                                                                                                                                              | `0.0.290`                                         |
| `e0273194c8` | 2026-07-22 01:08 +0300 | Identity and Telegram repair, temporary integration spec, identity / subjects-to-identities / subjects-to-social-module-profiles / Social chat and relation constraints and migrations, Social contract test, apply step added to `migrate.sh` and `api:db:migrate`, `set -euo pipefail` and foreground `migrate.sh seed` in `start.sh`, 1,411 lines of runtime cleanup removed from `bootstrap.ts`, advisory-lock target removed from shared database config | `0.0.291` (2026-07-22)                            |
| `ecf319e3bf` | 2026-07-22 12:02 +0300 | `start.sh`: `./migrate.sh seed` changed to `./migrate.sh seed &` (one-line message: "keep message handling available during migrations")                                                                                                                                                                                                                                                                                                                      | `0.0.292` (2026-07-22, tag points at this commit) |
| `53b059643c` | 2026-07-25             | Identity `0002_late_power_man.sql` drops the plain-email index and `constraints/singlepage.ts` loses the matching declaration; aggregate `@sps/rbac:repository-migrate` moves the apply step from first to last; temporary spec gains the checkout-email case; identity README updated                                                                                                                                                                        | `0.0.295` (2026-07-28)                            |

Tags `0.0.293` (2026-07-23), `0.0.294` (2026-07-24), and `0.0.296` through `0.0.302` (2026-07-28 to 2026-08-14) contain no further changes to the repair files, `migrate.sh`, `start.sh`, `apps/api/project.json`, or `libs/modules/rbac/project.json`. The issue text and comments (2026-07-21T19:51Z, 20:59Z, 21:09Z) predate `0.0.291`, `0.0.292`, and `0.0.295`.

### Removal-gate evidence required by the issue and what exists

The issue body, the ticket, and the second comment require, per maintained downstream project and environment: the deployed compatibility version, deployment timestamp, migration result, a deployment-log excerpt showing `RBAC_NATURAL_KEY_REPAIR` with `mode=apply` and no `RBAC_NATURAL_KEY_REPAIR_FAILED`, a `repository-natural-key-repair-check` run with exit `0`, `skipped=false`, and zero counts in every `identity`, `telegram`, and `grants` `after` block, a `pg_indexes` confirmation of the generated indexes, a log review for the listed error patterns, and a two-rapid-`/start` cardinality smoke test.

None of this evidence exists in the repository or the issue at the time of research:

- The GitHub issue has two comments, both defining the contract; no rollout table, version, or per-environment row has been posted.
- `thoughts/shared/handoffs/singlepagestartup/ISSUE-211-progress.md:47` records that live Telegram verification was left to the user at code review; `thoughts/shared/plans/singlepagestartup/ISSUE-211.md` leaves the manual "restored affected database can be backed up, repaired, constrained, and rechecked" item unchecked.
- No list of maintained downstream projects exists in `tools/deployer/`, `thoughts/`, or any README.
- The repository does not record which tag is the compatibility release; the history above is the only source for that determination.

### Claims in the issue and comments verified against live code

| Claim                                                                                                                      | Live code                                                                                                                                                                                                                    | Status                                                                                 |
| -------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| The four repair files and their integration tests exist under `libs/modules/rbac/backend/repository/database/src/lib/`     | Present: `natural-key-repair.ts`, `identity-natural-key-repair.ts`, `telegram-natural-key-repair.ts`, `repair-natural-keys.ts`, `natural-key-repair.integration.spec.ts`, `temporary-natural-key-repair.integration.spec.ts` | Verified                                                                               |
| `repository-natural-key-repair-check` / `-apply` targets exist                                                             | `libs/modules/rbac/project.json:56-71`                                                                                                                                                                                       | Verified                                                                               |
| A repair call is nested in aggregate RBAC migrate                                                                          | `libs/modules/rbac/project.json:50-52` (last step, not first)                                                                                                                                                                | Verified; README `:131-133` describes the old order                                    |
| Pre-Social invocation in `apps/api/project.json` and `migrate.sh`                                                          | `apps/api/project.json:108` before `:111`; `migrate.sh:15` before `:18`                                                                                                                                                      | Verified                                                                               |
| Apply runs before RBAC natural-key migrations                                                                              | `apps/api/project.json:108` before `:120`; `migrate.sh:15` before `:19`                                                                                                                                                      | Verified for the deployment scripts; inside the aggregate target the order is reversed |
| `start.sh api` runs `migrate.sh seed` in the foreground and a failure stops the new API task                               | `start.sh:12` is `./migrate.sh seed &`; `start.sh:13` starts the API unconditionally                                                                                                                                         | Contradicted since `ecf319e3bf` / tag `0.0.292`                                        |
| `RBAC_NATURAL_KEY_REPAIR` and `RBAC_NATURAL_KEY_REPAIR_FAILED` markers exist                                               | `repair-natural-keys.ts:36`, `:48`                                                                                                                                                                                           | Verified                                                                               |
| Check mode returns `skipped`, `identity`, `telegram`, `grants` with `after` counts                                         | `repair-natural-keys.ts:37-42`; result shapes at `natural-key-repair.ts:29-35`, `identity-natural-key-repair.ts:41-48`, `telegram-natural-key-repair.ts:27-33`                                                               | Verified                                                                               |
| Generated provider-specific identity, identity-owner, Telegram chat/default-thread, and relation-pair unique indexes exist | See constraints table                                                                                                                                                                                                        | Verified                                                                               |
| Runtime keeps handling for an identity with no subject relation                                                            | `bootstrap.ts:863-876`                                                                                                                                                                                                       | Verified                                                                               |
| Telegram request processing contains no historical duplicate merge/cleanup routines                                        | No such routine in `bootstrap.ts`; `bootstrap.spec.ts:549-556`                                                                                                                                                               | Verified                                                                               |
| Temporary rollout instructions exist in RBAC documentation                                                                 | `libs/modules/rbac/README.md:115-147`                                                                                                                                                                                        | Verified                                                                               |

## Code References

- `libs/modules/rbac/backend/repository/database/src/lib/repair-natural-keys.ts:13-19` - `--apply` / `--check` mode selection.
- `libs/modules/rbac/backend/repository/database/src/lib/repair-natural-keys.ts:27-55` - sequential identity, Telegram, grant repair; `RBAC_NATURAL_KEY_REPAIR` / `RBAC_NATURAL_KEY_REPAIR_FAILED` logging; exit codes.
- `libs/modules/rbac/backend/repository/database/src/lib/natural-key-repair.ts:4` - shared `NaturalKeyRepairMode` type.
- `libs/modules/rbac/backend/repository/database/src/lib/natural-key-repair.ts:238-347` - grant apply transaction.
- `libs/modules/rbac/backend/repository/database/src/lib/natural-key-repair.ts:349-401` - skip / check / apply entry with convergence assertion.
- `libs/modules/rbac/backend/repository/database/src/lib/identity-natural-key-repair.ts:18-39` - ID diagnostic types.
- `libs/modules/rbac/backend/repository/database/src/lib/identity-natural-key-repair.ts:134-142` - provider-specific natural-key expression.
- `libs/modules/rbac/backend/repository/database/src/lib/identity-natural-key-repair.ts:397-551` - identity apply transaction (newest identity wins).
- `libs/modules/rbac/backend/repository/database/src/lib/telegram-natural-key-repair.ts:48-76` - twelve repaired tables.
- `libs/modules/rbac/backend/repository/database/src/lib/telegram-natural-key-repair.ts:100-142` - fresh-database skip and partial-availability failure.
- `libs/modules/rbac/backend/repository/database/src/lib/telegram-natural-key-repair.ts:359-657` - Telegram apply transaction.
- `libs/modules/rbac/backend/repository/database/src/lib/natural-key-repair.integration.spec.ts:150-285` - grant repair scenarios.
- `libs/modules/rbac/backend/repository/database/src/lib/temporary-natural-key-repair.integration.spec.ts:284-605` - identity, Telegram, and fresh-database scenarios.
- `libs/modules/rbac/backend/repository/database/src/lib/natural-key-constraints.spec.ts:61-179` - permanent RBAC constraint contract test.
- `libs/modules/social/natural-key-constraints.spec.ts:40-110` - permanent Social constraint contract test.
- `libs/modules/rbac/jest.integration.config.ts:4` - integration spec selection.
- `libs/modules/rbac/project.json:38-55` - aggregate `repository-migrate` with apply as the last step.
- `libs/modules/rbac/project.json:56-71` - check and apply targets with `envFile: apps/api/.env`.
- `apps/api/project.json:76-133` - `api:db:migrate` with apply at `:108`.
- `apps/api/project.json:160-170` - `prepare` target invoking `api:db:migrate`.
- `migrate.sh:3`, `migrate.sh:15`, `migrate.sh:18-19`, `migrate.sh:25-27` - fail-fast flag, apply step, Social and RBAC migrations, seed.
- `start.sh:3`, `start.sh:10-14` - fail-fast flag and the backgrounded migration call.
- `up.sh:10` - local bootstrap path into `api:db:migrate`.
- `tools/deployer/api/docker-compose.api.yaml.j2:12`, `:19-20` - Swarm API command and `start-first` update order.
- `Dockerfile:59-60` - executable bits for `migrate.sh` and `start.sh`.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/telegram/bootstrap.ts:715` - bot profile not found error.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/telegram/bootstrap.ts:825-900` - identity, link, and subject resolution kept after cleanup.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/telegram/bootstrap.spec.ts:549-556` - "without runtime cleanup" scenario.
- `libs/modules/rbac/README.md:80-113` - permanent natural-key documentation.
- `libs/modules/rbac/README.md:115-147` - temporary rollout section.
- `libs/modules/rbac/models/identity/backend/repository/database/src/lib/constraints/singlepage.ts:14-37` - four identity partial unique indexes.
- `libs/modules/rbac/models/identity/backend/repository/database/src/lib/migrations/0001_purple_dorian_gray.sql:1-5` and `0002_late_power_man.sql:1` - identity index creation and the plain-email index drop.
- `libs/modules/social/relations/chats-to-threads/backend/repository/database/src/lib/constraints/singlepage.ts:14-20` - chat-thread pair and one-default-thread indexes.
- `libs/shared/backend/utils/src/lib/logger/index.ts:10-18` - logger provider selection.

## Architecture Documentation

The repair lives in the RBAC module's shared repository database package rather than in any single model or relation repository, because it spans two RBAC models, three RBAC relations, three Social models, and six Social relations. It talks to PostgreSQL through the raw `postgres` client from `@sps/shared-backend-database-config`, addresses tables by their physical names, and never imports Drizzle schemas or SDK providers. Each of the three repair functions accepts injected `sql` and table names so the integration specs can run against throwaway tables in the shared integration database.

Every repair function follows the same shape: detect whether its tables exist (skip on a fresh database, throw on partial presence), run a read-only `repeatable read` inspection in check mode, or lock the tables in `SHARE ROW EXCLUSIVE` mode and mutate inside one transaction in apply mode, then re-inspect and throw if duplicates remain so the transaction rolls back. Canonical-row selection differs by domain: earliest row for grants, newest row for identities and ownership links, and deterministic-slug-then-earliest for Telegram chats, threads, and profiles.

The permanent invariants are declared in `constraints/singlepage.ts` per repository and composed through `constraints/startup.ts` and `constraints/index.ts`, mirroring the `fields/` composition. Startup projects inherit the singlepage indexes and may add their own. Drizzle migrations are generated by the scoped `repository-generate` targets and applied by the scoped `repository-migrate` targets; the module-level aggregate targets sequence the scoped ones. The deployment scripts (`migrate.sh`, `api:db:migrate`) sequence modules and insert the repair as one step between `@sps/knowledge` and `@sps/social`.

The Swarm deployment runs the migration chain inside the API container itself at start time rather than as a separate job. Since tag `0.0.292` that chain is a background process of the container entry script.

## Historical Context (from thoughts/)

- `thoughts/shared/research/singlepagestartup/ISSUE-211.md` documents the original race (independent `forum_topic_created` and `/start` background tasks, find-then-create grant provisioning, no natural-key indexes) and records that the restored local dump contained no duplicates. Its references to runtime duplicate handling in `bootstrap.ts:1321-1469`, `:1586-1655`, and `:1847-1900` describe code that commit `e0273194c8` removed; the file is now 1,163 lines.
- `thoughts/shared/plans/singlepagestartup/ISSUE-211.md` Phase 1 planned the grant repair as an RBAC-owned maintenance command with check/apply targets. Phase 3 planned PostgreSQL advisory locks for bootstrap and free-subscription checkout; `libs/modules/rbac/README.md:107-113` and the absence of `advisory-lock.ts` show that approach was later replaced by constraint-only enforcement. The plan's "Migration Notes" (quiesce, check, apply, migrate, verify) are the ancestor of `libs/modules/rbac/README.md:124-135`.
- `thoughts/shared/handoffs/singlepagestartup/ISSUE-211-progress.md:21-23` records that the local database had no pre-existing duplicate groups and that duplicate inserts returned PostgreSQL `23505` after migration; `:47` records that live Telegram verification was left to the user.
- `thoughts/shared/research/singlepagestartup/ISSUE-213.md:28` and `:135` describe advisory locks at `bootstrap.ts:1726-1734` and `checkout-free-subscription.ts:131-145` and an `advisory-lock.integration.spec.ts`; that research was written at commit `254fb0b6` on 2026-07-21, before `e0273194c8` removed the locks. Its description of the grant repair (`:47`, `:146`) still matches `natural-key-repair.ts:238-400`.
- `thoughts/shared/processes/singlepagestartup/ISSUE-216.md` (Create phase) records that the issue was created on 2026-07-21 and that removal is gated on downstream evidence.

## Related Research

- `thoughts/shared/research/singlepagestartup/ISSUE-211.md`
- `thoughts/shared/plans/singlepagestartup/ISSUE-211.md`
- `thoughts/shared/handoffs/singlepagestartup/ISSUE-211-progress.md`
- `thoughts/shared/research/singlepagestartup/ISSUE-213.md`
- `thoughts/shared/tickets/singlepagestartup/ISSUE-216.md`

## Open Questions

- Which tag is "the compatibility release"? The repair components landed across `0.0.290`, `0.0.291`, and `0.0.295`; `0.0.291` is the first tag in which both the identity/Telegram repair and the `migrate.sh` / `api:db:migrate` wiring exist, and `0.0.295` is the first in which the identity index set matches today's declarations. The repository does not record a choice.
- Which downstream projects and environments are "maintained"? No inventory exists in the repository, `tools/deployer/`, `thoughts/`, or the issue.
- No per-environment evidence (deployment timestamp, `RBAC_NATURAL_KEY_REPAIR` log excerpt, `repository-natural-key-repair-check` output, `pg_indexes` result, log review, `/start` smoke test) has been recorded anywhere. The gate defined by the issue is therefore not met as of this research, and nothing in the repository can substitute for operator-recorded evidence.
- The ticket says to keep migrations "foreground/fail-fast unless a separate reviewed change intentionally revises that policy". Commit `ecf319e3bf` backgrounded `migrate.sh seed` with a one-line message and no issue reference. Whether that commit counts as the intended policy revision, and what the operator considers the current deployment contract, is not recorded.
- `libs/modules/rbac/README.md:117-122` and `:131-133` describe the foreground policy and the repair-first aggregate order that no longer match `start.sh:12` and `libs/modules/rbac/project.json:50-52`. Whether these are documentation lag or intended targets is not recorded.
- When the repair runs in the background after the API has started, the issue's requirement that a repair failure prevent the new API task from serving is not enforced by the scripts. How an operator would detect a failed background repair on a downstream deployment (beyond reading container logs for `RBAC_NATURAL_KEY_REPAIR_FAILED`) is not documented.
- Whether the plain-email index create/drop pair (`0001_purple_dorian_gray.sql:5`, `0002_late_power_man.sql:1`) had any effect on downstream databases that migrated between `0.0.291` and `0.0.295` is unknown from the repository alone; the migrations remain in place either way.
