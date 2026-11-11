Closes #309.

## Summary

Update the SDK behind the public MCP endpoint and the multipart parser used by the LLM audio endpoint. The previous SDK could route messages to the wrong client when a server or transport was reused. Later advisories also cover excessive memory use while validating a single request. SPS already creates a separate MCP server and transport per HTTP session; this change upgrades the SDK and enables its input limit.

## Changes

| Runtime dependency | Current main | This PR |
| ------------------ | ------------ | ------- |
| MCP TypeScript SDK | 1.18.1       | 1.32.2  |
| Zod (root install) | 3.24.2       | 3.25.76 |
| python-multipart   | 0.0.20       | 0.0.32  |

- An MCP tool call may contain at most 10,000 object keys and array elements across its arguments. The SDK checks this before schema validation. The existing HTTP body limit still applies (4 MiB by default). Tool names and OAuth routes are unchanged.
- MCP registers tools using the SDK's public callback type. Two RBAC chat forms now import Zod through its public entry point. The Telegram service registers its existing HTTP routes with Hono's typed path-array overload.
- Next.js 16.4.3, Hono 4.13.16 and the shared HS256 verifier already come from main. A regression test checks that a token signed with HS512 is rejected without exposing it in the error.
- Dependabot checks npm, pip, GitHub Actions and Docker weekly. npm minor and patch version updates are grouped. The separate transitive dependency update is #344.

## Verification

- [x] Install the lockfile in an empty directory with npm ci --ignore-scripts. Check the resolved SDK, Zod and the SDK's HTTP adapter.
- [x] MCP TypeScript check and 121 MCP tests, including OAuth and session handling; 120 JWT and HTTP error tests; 45 Telegram tests; 13 Python LLM tests.
- [x] Start the Bun HTTP server. An unauthenticated request returned 401. An authenticated SDK client discovered 20 tools; a call over the element limit failed and the next ordinary call succeeded in the same session.
- [x] Send a multipart audio fixture to the FastAPI transcription route with the transcription engine stubbed: valid form returned 200, missing boundary returned 400.
- [ ] Telegram's full TypeScript check still reports nine errors in shared code. All nine were reproduced on main; the tenth, in Telegram route registration, is fixed here.

## Notes

On November 11, 2026, npm audit --omit=dev reported 96 affected packages versus 98 on main, with no new advisory IDs. Five critical findings remain in both trees. The existing Zod finding [GHSA-mrhx-c7xc-m3w5](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5) requires Zod 4.6.6 or later; the MCP input limit protects tool arguments, not other Zod consumers.

Relevant SDK advisories: [cross-client responses](https://github.com/advisories/GHSA-345p-7cg4-v4c7) and [memory exhaustion during validation](https://github.com/advisories/GHSA-46jr-4wx8-v453).

## Downstream migration

Refresh the npm install and rebuild the LLM image. Align project-owned manifests that pin the SDK or Zod; replace imports from zod/lib or node_modules/zod/lib with imports from zod. For a custom MCP server, configure its tool input limit and test an oversized call followed by an ordinary call in the same session. Split bulk tool calls over the limit. No database, login or environment migration is required.
