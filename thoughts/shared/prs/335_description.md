# Restrict server-side URL downloads and observer requests

## Summary

`createFromUrl` and Broadcast observer steps previously passed supplied URLs to
Bun fetch. This could read a local `file:` URL or contact a private HTTP service.
A URL check alone also left HTTPS vulnerable to a second DNS resolution, and
redirects could forward unrecognized credential headers.

## Changes

Both operations use `fetchOutboundUrl`. Remote reads from stored File metadata
(`readBytes`, including the content route) also use it so updating a stored URL
cannot bypass validation. Public destinations are validated and
pinned through the installed Undici transport, with TLS hostname and chain
verification before HTTP. Redirects are rechecked, custom headers are removed
on origin changes, cross-origin bodies/mutations and HTTPS downgrades are
rejected. A shared deadline covers DNS and streaming; late DNS cannot start IO.
Wire and decoded response sizes are bounded, including gzip, deflate and Brotli.

User downloads do not inherit blanket API/Host access. The exact image-generator
URL remains allowed so `generate` works. Trusted observer calls explicitly allow
service origins; additional operator allowlisted origins apply to both callers.
File Storage validates URL input, forwards cancellation and rejects remote error
pages before writing. SDK paths and payloads remain unchanged.

The live payment check also exposed Next.js ImageResponse refusing the receipt
background at the internal API URL. Host now loads the saved template by UUID
through the File SDK, checks its variant and raster bytes, and embeds those bytes
in the renderer. Caller-provided image URLs and MIME labels are ignored; the
public generator adds no operator credentials. Template images have a 5 MiB
limit. The product attachment uses the same boundary, and Open Graph reads its
fixed favicon from Host's public directory. The receipt no longer prints the
internal JSON payload.

Undici 7.30.1 is a direct root runtime dependency. The older installed 7.29.1 had
published advisories, so the fix uses the patched version. The import uses the
installed package entrypoint to avoid Bun's partial built-in shim. The previous
native fetch approach was rejected after an actual TLS test showed Bun 1.3.6
sending HTTP before a custom certificate check failed.

## Verification

- [x] `npx jest --config libs/shared/backend/utils/jest.config.ts --runInBand --runTestsByPath libs/shared/backend/utils/src/lib/outbound-url/index.spec.ts`: 100 tests.
- 29 File Storage handler and upload-route tests, including unchanged uploads.
- 4 observer tests, including authenticated internal pipeline calls.
- [x] `npx jest --config apps/host/jest.config.ts --runInBand --runTestsByPath apps/host/app/api/image-generator/image.png/route.spec.tsx`: one test exercises 13 image-source scenarios, including injected URLs, access refusal, variant mismatch and disguised HTML/SVG.
- 31 isolated integration scenarios on Bun 1.3.6 and Bun 1.3.14: real sockets,
  TLS certificates, private-service trap, redirects, stalled streams,
  decompression limits, Hono handler and actual local file writes.
- Shared backend-utils TypeScript check and scoped checks of changed production files.
- ESLint, Prettier and diff whitespace checks on changed code.
- No database schema or production data changes.

The real local API was also started with `npm run api:dev` against the existing
PostgreSQL database after applying #333's application-role migration to that
checkout. Both legacy application/Redis passwords were replaced locally. A
public PNG import returned 201, the content route returned the original 13,504
bytes, and local-file, loopback and metadata URLs returned 400. Updating the
fixture's stored URL to a private address was also refused by the content route.
The test record and bytes were deleted through the API. The database backup
and environment changes are local and excluded from Git.

The complete checkout was exercised with the real API, Next.js dev Host,
PostgreSQL and Redis. A temporary copy of the local database retained its receipt
template; copied observer jobs and commerce notification templates were removed
to avoid processing existing orders or sending messages. Separate USD (58) and
RUB (3800) dummy purchases reached Invoice `paid`, Payment Intent `succeeded`
and Order `approving`. Each had one readable 1500×1500 PNG receipt, and both
observer messages were consumed. Repeated webhooks retained one receipt and the
same order state. No check endpoint or paid-state write was invoked by the test
client. Real provider authorization and fiscal receipt issuance were not tested.

An existing recovery gap remains: Order update saves `paid` before generating
the receipt. If generation fails, a later check skips that already-paid Order.
A pre-existing local Order confirmed this state and was left unchanged.
Correcting the image source prevents the reproduced failure. Recovery through
the existing scheduled order check remains follow-up work.

## Notes

The whole File Storage TypeScript command reports errors in existing frontend
specs and shared repository types, then exhausts its default 4 GiB heap. It is
not a passing full-module typecheck. The repository-wide placement check also
reports the existing Studio `Files.tsx` / `Files/` pair. Neither was introduced
by this change.

The production npm audit no longer reports the root Undici 7.30.1 used here. It
still reports the existing Undici 5.29.0 nested under `@vercel/blob` 0.27.2, along
with unrelated dependencies. Updating that provider needs its own compatibility
review; this PR does not claim a clean audit for the entire repository.

## Deployment and limits

Install root dependencies with the updated lockfile. Keep
`OUTBOUND_URL_ALLOWED_ORIGINS` empty unless a required internal integration needs
it. User-defined private downloads previously relying on an implicit service
origin now fail; review those integrations instead of adding broad exceptions.
An observer mutation requiring a redirect to another origin should point directly
to its intended destination. GET/HEAD file redirects to public CDNs still work.

The guard is not a malware scanner, file authorization system or global
rate/concurrency limiter. Plain HTTP remains permitted. Stored-file delivery,
RBAC, quotas and network egress restrictions retain their own responsibilities.
See the File model README for exact rules and a repeatable Docker test command.

## Downstream migration

Projects with custom outbound requests, image templates or deployment scripts
need to review these changes:

- Install root dependencies from the updated lockfile, including Undici 7.30.1.
- Route downloads of user-supplied or stored URLs through `fetchOutboundUrl`.
  Only trusted observer configuration should enable `allowServiceOrigins`.
  Check custom private integrations before adding an explicit origin exception;
  the exception also permits user downloads from that origin.
- Preserve `OUTBOUND_URL_ALLOWED_ORIGINS`, `OUTBOUND_URL_TIMEOUT_MS` and
  `OUTBOUND_URL_MAX_RESPONSE_BYTES` in owned deployment scripts. Defaults are
  an empty allowlist, 30 seconds and 50 MiB. File downloads retain their separate
  `FILE_STORAGE_MAX_UPLOAD_BYTES` limit.
- Point observer mutations at their final URL. Cross-origin mutations and HTTPS
  downgrades are refused; credential headers do not follow cross-origin redirects.
- Saved receipt/product templates must have a matching variant and publicly
  readable PNG, JPEG, WebP, GIF or AVIF bytes up to 5 MiB. Preserve project content
  and pass verified `backgroundImage` bytes into owned renderers instead of
  fetching payload URLs. The public generator must not add operator credentials.
- Verify public downloads, private-address refusal, oversized responses and a
  complete checkout: paid Invoice, succeeded Payment Intent, one readable receipt
  and consumed observer messages. Existing paid Orders without receipts still
  require recovery outside this change.

## Issue

Closes #307. Base: main; incorporates the merged #331 upload limits and #334.
