---
repository: singlepagestartup
issue_number: 318
status: Research Needed
created: 2026-09-25
---

# Issue: Create a least-privilege database role and restrict backup permissions

## Metadata

**URL**: https://github.com/singlepagestartup/singlepagestartup/issues/318
**Status**: Research Needed
**Created**: 2026-09-25
**Priority**: medium
**Size**: small

---

## Embargo

The public issue carries a neutral title and no detail. This ticket, the
research document `thoughts/shared/research/singlepagestartup/2026-09-25-security-review.md` and the issue map beside it stay local until
the fix is published together with the finding.

## Problem to Solve

The application connects to PostgreSQL as the image's superuser in every environment; no other role exists. The nightly dump writes every table, including identities, into a directory created with mode 0755, with no chmod on the dump and no rotation.

Findings: N-10 in the research document.

## Key Details

- `apps/db/create_env.sh:36-42`, `apps/api/create_env.sh:62-66`, `apps/db/Dockerfile:1`
- `tools/deployer/server/set_cron_jobs.yaml:20-24`, `tools/deployer/server/create_db_dump.sh:8-10`, `tools/deployer/server/install_psql.yaml:28-32`

## Implementation Notes

- Create an application role with only the grants the schema needs; keep the superuser for migrations only.
- Create the backup directory with 0700, chmod each dump, rotate, and consider excluding or encrypting the identity table.
