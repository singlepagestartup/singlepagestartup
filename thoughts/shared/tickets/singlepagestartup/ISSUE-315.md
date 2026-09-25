---
repository: singlepagestartup
issue_number: 315
status: Research Needed
created: 2026-09-25
---

# Issue: Review the host revalidation route access model

## Metadata

**URL**: https://github.com/singlepagestartup/singlepagestartup/issues/315
**Status**: Research Needed
**Created**: 2026-09-25
**Priority**: high
**Size**: xs

---

## Embargo

The public issue carries a neutral title and no detail. This ticket, the
research document `thoughts/shared/research/singlepagestartup/2026-09-25-security-review.md` and the issue map beside it stay local until
the fix is published together with the finding.

## Problem to Solve

The host `GET /api/revalidate` revalidates any tag or path for any caller, and the API's revalidation middleware calls it without a credential and without encoding the tag.

Findings: SEC-25 in the research document.

## Key Details

- `apps/host/app/api/revalidate/route.ts:7-32`
- `libs/middlewares/src/lib/revalidation/index.ts:126-132`

## Implementation Notes

- Require a shared secret header on the route, send it from the API, encode the tag, and document the new variable for downstream deployments.
