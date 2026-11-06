## Summary

Upgrade the installed Host runtime to Next.js 16.4.3 and React/React DOM 19.3.1, with stable 19.3.0 types. Merge current main into the original Dependabot change and verify the former Turbopack dev OOM scenario on the real app.

## Changes

- Update root dependencies and npm lockfile, Next companion packages and the generated Host deployment manifest. Align Nx packages on 22.7.12; resolve its CLI through the package manifest.
- Keep Turbopack development and explicitly select Webpack production. Disable caching for the continuous dev target, rename locale middleware to proxy, remove retired config keys and keep the root AGENTS.md as the instruction owner.
- Preserve immediate single/batch cache expiration with `revalidateTag(tag, { expire: 0 })`.
- Complete inherited Hono 4.13.16 compatibility: explicitly verify HS256 RBAC JWTs, sanitize algorithm-mismatch errors and validate required route params.
- Update test fixtures for current message DTOs, service/schema exports, async cart mutations, action labels and React document-shell streaming.

## Verification

- [x] Delete node_modules and old Host/Nx build caches; install 3314 packages on Node 24/npm 11.
- [x] Final root `npm ci --dry-run --ignore-scripts --offline --no-audit --no-fund` accepts the manifest/lock pair.
- [x] Cold Turbopack dev, ordinary warm restart, final cold dev and hot reload; real Browser routes and client controls pass, with no browser errors or OOM. Observed process-tree peaks: 4147.9 MiB first cold, 2363.5 MiB warm, 4064.1 MiB final cold.
- [x] Full Webpack production build with TypeScript and prerendering; 2448.6 MiB observed process-tree peak. Local flags: heap 8192 MiB, one build CPU, Webpack disk cache disabled; Nx cache bypassed.
- [x] Production start and Browser checks of landing/document preview and Framework external Widgets.
- [x] Production ISR: HIT/HIT → batch invalidation → MISS; single-tag invalidation → MISS; malformed batch 400; unsupported locale 404.
- [x] Host 55, backend utilities 147, Billing/Notification/middleware 97, RBAC 999, launcher 2: all 1300 tests pass with checked-in exclusions retained.
- [x] Targeted Host ESLint, changed-file Prettier, diff checks and module dependencies: 15503 files, zero violations.

## Notes

Full evidence, commands, limits and comparison with React 19.0 are in [runtime validation](../research/singlepagestartup/2026-11-02-next16-runtime-validation.md). RSS was sampled every two seconds on an 18 GiB machine; no comparative memory guarantee is claimed. A full Docker image was not built. The global placement checker retains the base tree's Studio Files.tsx/Files collision outside this diff.

## Downstream migration

Align owned Next/React/Nx manifests and locks, remove RC type overrides, install from the root and rebuild/restart. Preserve Turbopack dev, explicit Webpack build, locale proxy behavior and immediate tag expiration. Update owned Hono verification calls with the signer's expected algorithm (HS256 for SPS sessions/refresh), validate required params, and adapt owned fixtures to the current DTO/async mutation contracts. Verify authenticated/denied routes, a real cold page load, hot reload, production rendering and warmed-cache invalidation. No database migration is required.
