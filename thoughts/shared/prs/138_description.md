## Summary

Update the Hono runtime used by SPS from 4.10.4 to 4.13.16. The original PR changed only the Host manifest to 4.11.7; deployment and local Nx commands install from the root lockfile.

The authorization regression is reproduced with the production IsAuthorized middleware: four encoded line terminators in an unknown private path skip authorization and return 404 on 4.10.4. On 4.13.16 the permission service is called and denial returns 403. This demonstrates a skipped authorization check, not access to a protected record. See the [Hono advisory](https://github.com/honojs/hono/security/advisories/GHSA-h7mg-cq63-vhpq) and [4.13.16 release](https://github.com/honojs/hono/releases/tag/v4.13.16).

## Changes

- Pin Hono 4.13.16 in the root, Host, API, OpenAPI and Telegram manifests.
- Regenerate the Hono lock entry with npm, preserving unrelated dependency entries.
- Add authorization-before-404 regressions for ordinary unknown paths and four encoded line terminators, plus an authorized 404 control.
- Document root installation and manifest alignment. MCP uses the Node HTTP/MCP SDK transport; its API consumer tests are also checked.

## Verification

- [x] Baseline Hono 4.10.4: the four encoded-line-terminator regression cases fail with 404 instead of 403; six controls pass.
- [x] `node node_modules/jest/bin/jest.js --config libs/middlewares/jest.config.ts --runInBand` — 57 passed.
- [x] `node node_modules/jest/bin/jest.js --config libs/shared/backend/api/jest.config.ts --runInBand` — 94 passed; one existing database test skipped.
- [x] `RBAC_JWT_SECRET=rbac-jwt-secret KV_PROVIDER=memory node node_modules/jest/bin/jest.js --config apps/mcp/jest.config.ts --runInBand` — 57 passed using fixture secrets and memory storage.
- [x] `node node_modules/jest/bin/jest.js --config apps/api/jest.integration.config.ts --runInBand --runTestsByPath apps/api/specs/integration/revalidation-transport.integration.spec.ts` with local Redis configuration — one passed. A warmed HTTP cache, two TCP WebSocket clients and immediate fresh reads are verified; both clients and the listener close, and no fixture Redis keys remain.
- [x] Isolated `npm ci` from the exact Hono lock entry; isolated `npm audit --omit=dev` reports zero vulnerabilities. This is not a whole-repository audit.
- [x] Root `npm ci --dry-run --ignore-scripts --offline --no-audit --no-fund` on Node 24/npm 11 validates manifest/lock compatibility.
- [x] `bun build ./apps/telegram/server.ts --target bun --outdir /private/tmp/sps-hono-build/telegram`.
- [x] OpenAPI app smoke check: health response, YAML specification and CORS preflight.
- [x] Prettier check of changed source/manifests/docs and `git diff --check`.

## Notes

Full Docker/Next production builds and deployment were not run. An additional standalone API bundle experiment fails identically on the baseline and updated tree because node-pre-gyp references optional mock-aws-s3, aws-sdk and nock packages; no API bundle target is introduced or changed here. The repository's API runs source with Bun.

## Downstream migration

Applies to projects with owned Hono dependency declarations, locks or routing/middleware overrides. Align owned manifests and locks with 4.13.16, install from the repository root and rebuild/restart deployed services. Check custom wildcard and regular-expression routes against the upstream release notes. Verify allowed and denied requests, authorization before private 404 responses, and warmed-cache/WebSocket behavior. No database migration is required.
