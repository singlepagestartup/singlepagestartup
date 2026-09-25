---
issue_number: 229
issue_title: "Map expired JWT failures to 401 without logging token contents"
repository: singlepagestartup
created_at: 2026-09-17T23:12:00Z
last_updated: 2026-09-19T00:25:00Z
status: active
current_phase: complete
---

# Process Log: ISSUE-229 - Map expired JWT failures to 401 without logging token contents

## Purpose

Tracks cross-phase execution notes, incidents, reusable fixes, and workflow learnings.

## Phase Status

- Create: completed
- Research: completed
- Plan: completed
- Implement: completed
- Current phase: complete
- Next step: lead verification of branch `claude/issue-229-error-mapping`, then PR

## Phase Notes

### Create

- Summary: The GitHub issue was created on 2026-08-08 from a production audit of `api_api` without local ticket or process artifacts. The research phase created the ticket file from the issue body.
- Outputs: https://github.com/singlepagestartup/singlepagestartup/issues/229, `thoughts/shared/tickets/singlepagestartup/ISSUE-229.md`
- Notes: No issue comments existed at research time.

### Research

- Summary: Traced the expired-JWT path end to end: Hono 4.10.4 `JwtTokenExpired` message (`token (${token}) expired`) → uncaught `jwt.verify` in `is-authorized.ts:127` → controller catch → `getHttpErrorType` fallback (`http-error/index.ts:96-101`) → exception filter pass for the loopback request → `responsePipe` server `HTTPException` with JSON message → middleware catch (`is-authorized/index.ts:105-108`) → `getHttpErrorType` JSON branch keeps the 500 and message → exception filter pass for the original request. Enumerated all 25 Hono `jwt.verify` sites and the 3 `jsonwebtoken` sites in `apps/mcp`, with their catch blocks. Verified every issue line reference; confirmed the six load-bearing files are identical to upstream `961fe1bc37c3`. Recorded two divergences from the issue's framing: Hono's malformed-token message (`invalid JWT token: <jwt>`) is not matched by `/jwt malformed/i` and also falls to 500 today, and a plain `Authentication error. ...` message without a `[...]` prefix currently matches the 403 `/authentication/i` pattern unless a 401 phrase is present.
- Outputs: `thoughts/shared/research/singlepagestartup/ISSUE-229.md`, `thoughts/shared/tickets/singlepagestartup/ISSUE-229.md`
- Notes: Research ran in the isolated worktree `.claude/worktrees/issues-2026-09-18` without GitHub status changes or issue comments; those steps remain for the orchestrating session. Tests were not executed (see Incident 2).

### Plan

- Summary: Planned together with #232 and #241, which change the same four files. #229 is Phase 2 of the shared plan and lands after the 422 restoration, so the mapper spec is green before new scenarios are added. Scope for the shared verification helper was limited to the four call sites that verify a token supplied by an unauthenticated caller.
- Outputs: `thoughts/shared/plans/singlepagestartup/ISSUE-229.md`
- Notes: Plan approval was delegated to the lead, so the session did not wait for a review gate.

### Implement

- Summary: Added `verifyJwt` and `sanitizeErrorMessage` to `@sps/backend-utils`; the helper converts Hono JWT failures into `Authentication error. Token expired` or `Authentication error. Invalid token` by `error.name` and rethrows everything else. The mapper sanitizes the extracted message before classification, the 401 pattern list gained entries for an expired token, an invalid token, an invalid JWT token and a not-yet-valid token, and the exception filter sanitizes the joined message, the stack and the nested causes before they reach the log, the Telegram report and the response body. The four unauthenticated entry points that verify a caller-supplied token now use the helper.
- Outputs: commit on `claude/issue-229-error-mapping`; 91 + 12 + 305 tests pass across `@sps/backend-utils`, `@sps/shared-backend-api` and `@sps/rbac`.
- Notes: The old research question about which `jwt.verify` sites are in scope is answered in the plan's "What We're NOT Doing" section.

## Incident Log

> Record only substantive incidents: debugging sessions, wrong assumptions, tool friction, helper failures, workflow gaps, or repeated recoveries.

<!-- incident-count: 5 -->

### Incident 1 — Editorial-pass contract referenced by CLAUDE.md does not exist

- **Phase**: Research
- **Occurrences**: 1
- **Symptom**: CLAUDE.md requires a final editorial pass per `.agents/contracts/editorial-pass.md` (Codex: `.codex/skills/unslop/SKILL.md`). Neither file exists at commit `29370bcbf8`; `find` over `.agents`, `.claude`, and `.codex` for `*editorial*` or `*unslop*` returns nothing, and `AGENTS.md` has no `editorial` mention.
- **Root Cause**: The instruction was added to CLAUDE.md before (or without) the contract file being committed.
- **Fix**: Applied a general clarity pass (plain language, consistent terminology, uncertainty preserved) to the ticket, research, and process artifacts instead.
- **Preventive Action**: Restore or add `.agents/contracts/editorial-pass.md` and mirror the reference in `AGENTS.md`; until then, agents should note the missing contract rather than skip the pass.
- **References**: `CLAUDE.md` ("Before storing, publishing, or returning prose ..."), `.agents/contracts/` listing.

### Incident 2 — Worktree has no `node_modules`; dependency source read from the main checkout

- **Phase**: Research
- **Occurrences**: 1
- **Symptom**: `ls node_modules` fails in `.claude/worktrees/issues-2026-09-18`, so Hono's JWT error classes could not be inspected in place and no jest suite could be run.
- **Root Cause**: Git worktrees do not carry the untracked `node_modules` directory; `npm install` was never run in this worktree.
- **Fix**: Read `node_modules/hono/dist/utils/jwt/{types,jwt}.js` (4.10.4, matching `package-lock.json:29093`) and `node_modules/jsonwebtoken/verify.js` from the main checkout by absolute path, read-only. Recorded the regex traces as reading-based, not execution-based, in the research document.
- **Preventive Action**: Plan and implement phases that need to run tests in this worktree must run `npm install` there first (or symlink `node_modules`), and should confirm whether `http-error/index.spec.ts` passes today given its 422 block.
- **References**: `thoughts/shared/research/singlepagestartup/ISSUE-229.md` (Open Questions), `libs/shared/backend/utils/src/lib/http-error/index.spec.ts:100-114`.

### Incident 3 — Sandbox refuses compound shell forms in the isolated worktree

- **Phase**: Research
- **Occurrences**: 4
- **Symptom**: Bash commands using a shell function (`show(){...}`), a `for` loop that invoked `git log`, `find -exec`/`xargs sh`, and a `cat > file <<'EOF'` heredoc were all refused with "too complex to verify that it stays inside the worktree".
- **Root Cause**: Worktree isolation validates that every git-capable command targets the worktree; compound constructs cannot be statically verified.
- **Fix**: Re-issued reads as plain `sed -n 'a,bp' file` chains, ran each `git log`/`git diff` as its own single command, and wrote artifacts with the Write tool instead of heredocs.
- **Preventive Action**: In worktree sessions, keep each git command standalone, avoid shell functions and loops around git, and use the Write/Edit tools for file creation.
- **References**: This session's Bash refusals; `thoughts/shared/tickets/singlepagestartup/ISSUE-229.md` (written via Write tool).

### Incident 4 — A not-yet-valid token had no 401 pattern

- **Phase**: Implement
- **Occurrences**: 1
- **Symptom**: The new mapper scenario for Hono's `JwtTokenNotBefore` message failed with `Expected: 401, Received: 500`.
- **Root Cause**: The 401 list covered expiry, invalidity and signature mismatch after this change, but not `token (...) is being used before it's valid`.
- **Fix**: Added `/is being used before it's valid/i` to the 401 entry, so every Hono credential failure classifies as 401 even at the call sites this change did not migrate.
- **Preventive Action**: When mapping a library's error family, enumerate the library's error classes rather than the messages seen in production.
- **References**: `libs/shared/backend/utils/src/lib/http-error/paterns/index.ts`, `node_modules/hono/dist/utils/jwt/types.js`

### Incident 5 — Sanitizing the joined message shadowed the Telegram report variable

- **Phase**: Implement
- **Occurrences**: 1
- **Symptom**: After hoisting the sanitized text into `const message`, the Telegram block still declared its own `const message` that interpolated `message`, which is a temporal dead zone reference.
- **Root Cause**: The filter used the same name for the joined error text and for the composed notification.
- **Fix**: Renamed the notification variable to `report`; the sanitized error text keeps the name `message`.
- **Preventive Action**: When lifting an expression into a named constant, grep the enclosing function for that name before choosing it.
- **References**: `libs/shared/backend/api/src/lib/filters/exception/index.ts`

## Reusable Learnings

- The global `IsAuthorizedMiddleware` authorizes over an HTTP loopback to `/api/rbac/subjects/authentication/is-authorized`; any error raised there passes through `ExceptionFilter` twice (loopback request and original request), and `responsePipe` re-encodes the first response as a JSON-string `HTTPException.message` that `getHttpErrorType` decodes in its JSON branch (`http-error/index.ts:11-44`). Stack fragments listing both `authentication/is-authorized/index.ts:76` and `middlewares/is-authorized/index.ts:107` are this double pass.
- `getHttpErrorType` never rewrites message text except the 500 fallback prefix; status mapping via a regex leaves the original message intact. Hono JWT errors (`JwtTokenExpired`, `JwtTokenInvalid`, `JwtTokenSignatureMismatched`, `JwtTokenNotBefore`) embed the raw token in `error.message`, and each sets `error.name` to its class name.
- The 401 pattern list is evaluated before the 403 list; `/authentication/i` lives in the 403 entry, so a message beginning `Authentication error.` maps to 403 unless it contains a 401-listed phrase or uses the `[Authentication error]` bracket prefix.
- `libs/modules/rbac/jest.config.ts` excludes the `authentication/is-authorized` controller spec and `.integration.spec.ts` files; the service spec mocks `hono/jwt` to always succeed.
- `hono` sources are not in the worktree; read them from the main checkout's `node_modules` at the lockfile version when a worktree has not been installed.
- Hono's JWT failures are identifiable by `error.name` (`JwtTokenExpired`, `JwtTokenInvalid`, `JwtTokenSignatureMismatched`, `JwtTokenNotBefore`, `JwtHeaderInvalid`, `JwtPayloadRequiresAud`), which is stable while the message text is not and carries the credential. `JwtAlgorithmNotImplemented` is a configuration fault and must not become a 401.
- A spec can drive Hono's real verification instead of mocking it: sign with a past `exp` for expiry, verify with a different secret for a signature mismatch, pass an empty secret for a `DataError` and an undefined one for a `TypeError`.
