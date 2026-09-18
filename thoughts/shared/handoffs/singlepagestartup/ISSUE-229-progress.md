---
issue_number: 229
issue_title: "Shared HTTP error mapping: expired JWT (401), unique violation (409), unprocessable entity (422)"
covers_issues: [229, 232, 241]
start_date: 2026-09-18T23:26:21Z
plan_file: thoughts/shared/plans/singlepagestartup/ISSUE-229.md
status: in_progress
---

# Implementation Progress: ISSUE-229, ISSUE-232, ISSUE-241

**Started**: 2026-09-19
**Plan**: `thoughts/shared/plans/singlepagestartup/ISSUE-229.md`
**Worktree**: `.claude/worktrees/issue-229-error-mapping`, branch
`claude/issue-229-error-mapping` from `origin/main`.

One progress file covers the three issues because they change the same four
files and are implemented as three commits in one branch.

## Phase Progress

### Phase 1: Restore the 422 category and make the lane runnable (#241)

- [x] Started: 2026-09-18T23:30:00Z
- [x] Completed: 2026-09-18T23:45:00Z
- [x] Automated verification: `npx nx run @sps/backend-utils:jest:test`
      78 passed, 78 total (75 passed with 6 failures before the change);
      `npx nx run @sps/shared-backend-api:jest:test` 12 passed, 1 skipped.

**Notes**: The restored 422 entry alone would have moved every
`Validation error. Invalid body['data']: ... Expected string, got: ...` message
from the generic REST handlers to 422. A narrow 400 entry anchored to a leading
`Validation error` phrase, placed directly before the 422 entry, keeps those at 400. Three regression cases were added to the spec's 400 block to lock that.
The README's 422 keyword list named `invalid type`, which no restored pattern
matches on its own; it now names `invalid body['data']`, and the precedence rule
is stated under the table.

### Phase 2: Safe JWT verification and message sanitization (#229)

- [ ] Started: —
- [ ] Completed: —
- [ ] Automated verification: —

**Notes**: —

### Phase 3: Conflict category for unique violations (#232)

- [ ] Started: —
- [ ] Completed: —
- [ ] Automated verification: —

**Notes**: —

## Incident Log

> Read this section FIRST before starting any implementation work.
> Parallel agents: check here for known pitfalls before debugging independently.

<!-- incident-count: 0 -->

## Summary

### Changes Made

- (populated during implementation)

### Pull Request

- [ ] PR created: not in this session; the lead verifies the branch first.

### Final Status

- [ ] All phases completed
- [ ] All automated verification passed

---

**Last updated**: 2026-09-18T23:26:21Z
