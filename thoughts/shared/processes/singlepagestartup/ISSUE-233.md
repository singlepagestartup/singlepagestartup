---
issue_number: 233
issue_title: "Bound HTTP-cache generations and recover requests after Redis OOM/restart"
repository: singlepagestartup
created_at: 2026-09-17T23:22:38Z
last_updated: 2026-09-18T23:38:48Z
status: active
current_phase: implement
---

# Process Log: ISSUE-233 - Bound HTTP-cache generations and recover requests after Redis OOM/restart

## Purpose

Tracks cross-phase execution notes, incidents, reusable fixes, and workflow learnings.

## Phase Status

- Create: completed (issue created on GitHub by the operator; no local create-phase artifact existed)
- Research: completed
- Plan: completed
- Implement: completed (framework scope; see the Implement notes for what is deliberately left out)
- Current phase: implement
- Next step: lead review of branch `claude/issue-233-cache-bounds`, including the manual verification against a running API, then push and PR

## Phase Notes

### Create

- Summary: The issue was opened on GitHub on 2026-09-10 with a long incident report and received one follow-up comment on 2026-09-14 about crawler-amplified rendering. No ticket or process file existed before research.
- Outputs: GitHub issue #233 (`size:large`).
- Notes: The ticket snapshot was generated during research from the GitHub JSON so the incident tables and numbers stay verbatim.

### Research

- Summary: Documented the HTTP-cache key/version/TTL model, the ioredis provider configuration, the environment sources for `KV_TTL`, the deployment templates, the API startup path, the Host render and not-found path, `robots.txt`, request-ID handling, and readiness surfaces. Verified every file the issue references against live code; all are unchanged since the issue's upstream commit `99e3037f08`. Traced the full subject-list read to the Host page service's `fetchAllModuleEntities` (driven by the seeded `/rbac/subjects/[rbac.subjects.slug]` page) and the collection rotation to the anonymous-init `POST /api/rbac/subjects`.
- Outputs:
  - `thoughts/shared/tickets/singlepagestartup/ISSUE-233.md`
  - `thoughts/shared/research/singlepagestartup/ISSUE-233.md`
- Notes: Research was run inside the `issues-2026-09-18` worktree on branch `worktree-issues-2026-09-18` at commit `29370bcbf8` without GitHub status changes or comments; those steps remain for the operator or the next command run. The research keeps sub-topic A (retention/recovery) and sub-topic B (crawler fan-out) in separate sections.

### Plan

- Summary: Planned the framework part that removes the failure mechanism in three phases: bound the KV client and make every cache call fail open, bound what the cache retains, and give the Redis deployment a memory budget. Numeric budgets stay environment knobs with safe defaults. Plan approval was delegated to the lead, so the phases ran without a review pause.
- Outputs: `thoughts/shared/plans/singlepagestartup/ISSUE-233.md`
- Notes: The plan deliberately leaves out query canonicalisation, identity-aware keys, per-route TTLs, generation cleanup, the startup path and the public clear route. The last one is owned by a separate change; the others are SEC-04b scope in `thoughts/shared/plans/singlepagestartup/2026-09-19-dead-code-and-security-remediation.md`.

### Implement

- Summary: Every KV call on the request path now goes through a guard with a deadline that resolves to a miss or a skipped write; the shared ioredis client carries connect and command deadlines, a small retry budget and no offline queue, and reports connection state once per change. Version counters carry `KV_TTL`, refreshed on every bump, and responses above `HTTP_CACHE_MAX_ENTRY_BYTES` are served but not stored. Redis starts with `--maxmemory` and `--maxmemory-policy` locally and in the deployer template.
- Outputs:
  - `thoughts/shared/handoffs/singlepagestartup/ISSUE-233-progress.md`
  - `libs/middlewares/src/lib/http-cache/guard.ts`, `libs/middlewares/src/lib/http-cache/README.md`, and the changed files listed in the progress summary
- Notes: Not done here, by scope: query-string canonicalisation, identity-aware keys, per-route TTLs, active generation cleanup, the `5xx` version bump, the public clear route, the startup migration load, readiness routes and Redis metrics. No push and no PR; the lead verifies the branch against a running instance.

## Incident Log

> Record only substantive incidents: debugging sessions, wrong assumptions, tool friction, helper failures, workflow gaps, or repeated recoveries.

<!-- incident-count: 4 -->

### Incident 1 — Editorial-pass contract missing on the research branch

- **Phase**: Research
- **Occurrences**: 1
- **Symptom**: `CLAUDE.md` and the research brief require `.agents/contracts/editorial-pass.md`, but the file does not exist at commit `29370bcbf8`; `find` and `ls .agents/contracts` return nothing.
- **Root Cause**: The contract was added in commit `818f097d22` ("Make the agent system enforce a final editorial pass"), which is not an ancestor of the `main`-based worktree branch.
- **Fix**: Read the contract with `git show 818f097d22:.agents/contracts/editorial-pass.md` and applied its editing rules to the ticket, research, and process prose.
- **Preventive Action**: When a contract path from `CLAUDE.md` is absent, check `git log --all -- <path>` before treating the rule as optional; the canonical text may live on a newer branch.
- **References**: `.agents/contracts/editorial-pass.md` (commit `818f097d22`), `CLAUDE.md`

### Incident 2 — Worktree guard rejects compound shell forms

- **Phase**: Research
- **Occurrences**: 5
- **Symptom**: Bash calls that looped over `git diff` with `for f in ...`, evaluated `$((n+90))` on a variable, piped `$(grep -rl ...)` into `python3 -c`, or included the literal path segment `hash/` were refused with "worktree-isolated session ... too complex to verify".
- **Root Cause**: The worktree isolation guard rejects any command whose git target (or a token it cannot rule out as git) is computed at runtime.
- **Fix**: Re-issued each read as a plain command with literal paths, one `git` invocation per call, and used the `Read` tool for the `libs/shared/utils/src/lib/hash/sha256/index.ts` file.
- **Preventive Action**: In worktree sessions, keep `git` invocations single and literal, avoid shell arithmetic on variables, and prefer `find -path` or the `Read` tool when a path contains a word the guard flags.
- **References**: `libs/shared/utils/src/lib/hash/sha256/index.ts`

### Incident 3 — ISSUE-216 ticket describes a startup path that live code contradicts

- **Phase**: Research
- **Occurrences**: 1
- **Symptom**: `thoughts/shared/tickets/singlepagestartup/ISSUE-216.md` states the canonical Swarm path runs `migrate.sh seed` in the foreground and must fail the API start on migration failure.
- **Root Cause**: `start.sh:12` runs `./migrate.sh seed &` in the background, and `apps/api/specs/singlepage/index.spec.ts:74-91` asserts that form ("production migrations run without blocking the API"). The ticket text records an intended or earlier state, not the checked-in one.
- **Fix**: Recorded the live behaviour in the research document and flagged the ticket text as historical context that does not match code.
- **Preventive Action**: Treat ticket prose about deployment scripts as claims to verify; the contract spec is the current source of truth for `start.sh`.
- **References**: `start.sh:10-14`, `apps/api/specs/singlepage/index.spec.ts:74-91`, `thoughts/shared/tickets/singlepagestartup/ISSUE-216.md`

### Incident 4 — `volatile-lru` does not protect the namespaces that share the instance

- **Phase**: Implement
- **Occurrences**: 1
- **Symptom**: The first draft of the middleware README recommended `REDIS_MAXMEMORY_POLICY=volatile-lru` as the safe policy for a deployment whose Redis also holds MCP OAuth tokens and subject preferences.
- **Root Cause**: `volatile-lru` evicts keys that carry an expiry, and both of those namespaces are written with `EX` (`apps/mcp/lib/oauth.ts:196,213,230`; the subject model-favorites record passes a TTL). The policy would evict exactly what it was supposed to spare.
- **Fix**: Documented that eviction is a property of the instance, not of a namespace or a logical database, and that records which must survive belong on their own Redis instance; corrected the same claim in `tools/deployer/.env.example`.
- **Preventive Action**: Before naming a Redis eviction policy as a protection, check whether the keys it is supposed to protect are written with an expiry.
- **References**: `libs/middlewares/src/lib/http-cache/README.md`, `tools/deployer/.env.example`, `apps/mcp/lib/oauth.ts`

## Reusable Learnings

- The HTTP-cache key embeds the absolute request URL (`c.req.url`), so the same route reached through `http://api:4000`, `http://localhost:4000`, or the public hostname forms separate key families. Reproductions must use the deployment's `API_SERVICE_URL` host to match production keys.
- A version counter with a TTL cannot resurrect a stale generation as long as the TTL is refreshed on every bump: the bump that left generation `g` happened after the body at `g` was written, so the counter always outlives that body. This is what makes expiry a sufficient substitute for deleting superseded generations.
- `@sps/providers-kv` had a `jest.config.ts` but no `jest:test` target, so its specs were never run by any Nx target. When a lib looks untested, check `project.json` before assuming there is nothing to run.
- The Host page service resolves page existence by fetching entire module collections for every `[module.model.param]` URL segment; any seeded page with such a segment turns every same-depth URL lookup into full-table reads through the API's own cache.
- `git show <commit>:<path>` is the fastest way to read a contract that a newer branch added when the current branch predates it.
