## Summary

Locale redirects can expose the internal Next server port behind a reverse proxy. Cloning the middleware URL also retains a normalized loopback hostname, which can move a local login between `127.0.0.1` and `localhost` and change the cookie origin.

## Changes

- Apply the request Host header after clearing the cloned URL port; retain explicit public or local ports, paths and queries.
- Set `skipMiddlewareUrlNormalize` so Next preserves the middleware redirect origin.
- Type the middleware request as `NextRequest`, document the origin behavior and add seven regression cases.

## Verification

- [x] `NX_DAEMON=false NX_ISOLATE_PLUGINS=false npx nx run host:jest:test --runInBand --testFile=apps/host/middleware.spec.ts --skipNxCache` — 7 tests passed on SPS dependencies.
- [x] Prettier and `git diff --check` passed.
- [ ] Verify public and loopback HTTP redirects after deployment; automated coverage exercises the middleware with real NextRequest and NextResponse objects.

## Notes

No schema or public API changes. This PR contains only the Host correction.

## Downstream migration

Projects with owned locale middleware or Next configuration should preserve their routing rules while clearing retained internal ports before applying the request Host header. Keep explicit local/public ports, path and query parameters, and retain `skipMiddlewareUrlNormalize` when cookie origins must survive loopback redirects. Verify actual HTTP Location headers for public HTTPS domains, localhost and `127.0.0.1`, including already localized routes.
