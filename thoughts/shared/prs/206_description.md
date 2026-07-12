# Summary

Turns an AI `social.profile` into an MCP-powered employee in chat. The requester remains the billing/task initiator, while the single `rbac.subject` linked to the replying profile becomes the execution principal for MCP-to-API calls and the profile remains the visible reply author.

The OpenRouter reaction path now owns profile validation, Knowledge, skills, tool orchestration, billing, audit metadata, and final reply creation. The duplicated `react-by/knowledge` route and its SDK/agent/frontend/permission surfaces are removed.

Closes #199.

## Changes

- Added `social.profile.allowedMcpServerIds` with a generated Drizzle migration, a built-in `project` MCP descriptor, stale-id handling, and controls in both active profile admin form variants.
- Extended the OpenRouter wrapper with OpenAI-compatible `tools`, `tool_choice`, `parallel_tool_calls`, assistant `tool_calls`, and `role: "tool"` replay while preserving no-tool text/image behavior.
- Added a bounded sequential employee tool loop with six-step and 120-second limits, per-tool timeout/result caps, repeated-call protection, safe model fallback before side effects, model locking after side effects, redacted trace metadata, and one-time billing/session cleanup.
- Made linked Social skills and profile-scoped Knowledge available automatically for ordinary task messages while preserving explicit `/skill`, `@knowledge`, and `/learn` behavior.
- Added protected employee SPS-JWT exchange in `apps.mcp`: five-minute access token, no refresh token, subject derived only from verified `subject.id`, dedicated internal secret, and unchanged external OAuth flows.
- Added the project MCP Streamable HTTP client, live paginated tool catalog, JSON Schema validation, normalized results, profile-scoped catalog endpoint/SDK, and server-side employee JWT minting.
- Routed MCP-backed API work with the employee SPS bearer; no model-requested call uses `X-RBAC-SECRET-KEY` or duplicates record-level RBAC decisions in the orchestrator.
- Removed the legacy Knowledge reaction handler, route, permission snapshot, client/server SDK actions, agent method/tests, frontend mock, and documentation references.
- Added local/deployment configuration for `MCP_INTERNAL_TOKEN_EXCHANGE_SECRET` and `MCP_PROJECT_URL`, plus module/operator documentation and implementation artifacts.

## Verification

- [x] OpenRouter/shared Jest: 2 suites, 15 tests.
- [x] MCP Jest: 8 suites, 41 tests.
- [x] RBAC Jest: 44 suites, 183 tests.
- [x] Agent Jest: 8 suites, 30 tests.
- [x] Social MCP-focused Jest: 2 suites, 5 tests.
- [x] RBAC integration Jest: 1 suite, 3 tests.
- [x] TypeScript: shared-third-parties, MCP, RBAC, Social, and Agent configs.
- [x] ESLint: every changed/untracked TypeScript file.
- [x] Prettier, shell syntax, `git diff --check`, and zero live legacy-reaction reference checks.
- [x] Drizzle `up`/`generate` reproducibility: no additional schema changes after the generated profile migration.
- [x] Browser: the real Admin overlay shows one `Allowed MCP servers` region and one `Project MCP` checkbox; its state toggles without persisting test data.
- [x] Live API/MCP: employee exchange returned Bearer/300 seconds, `tools/list` returned 19 tools, and read-only `model-record-count` reached `apps.api` as the profile-linked employee subject.
- [ ] `npm run parity`: the approved plan references this command, but the repository does not define a `parity` script.
- [ ] Full Social Jest: one unrelated pre-existing `chat-profile-sidebar/Component.spec.tsx` suite imports `server-only` through a Client Component dependency; affected Social MCP tests, full Social TypeScript, and focused lint pass.
- [ ] Human review scenario: persist MCP on a disposable restricted employee profile, send a task from another requester, and inspect final message/audit metadata plus permitted/denied RBAC cases. No test chat message or persistent profile mutation was made during implementation verification.

## Notes

- Apply `0002_nice_molecule_man.sql` before enabling MCP on profiles in an existing database.
- Deploy API and MCP with the same new `MCP_INTERNAL_TOKEN_EXCHANGE_SECRET`; API also needs the internal `MCP_PROJECT_URL`.
- Removing `react-by/knowledge` is an intentional API contract change. All in-repository callers now use `react-by/openrouter`.
- Arbitrary/external profile MCP connection models remain out of scope; this PR supports the built-in project server id and preserves external MCP OAuth clients unchanged.
