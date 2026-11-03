Closes #315.

## Summary

Protect Host cache invalidation with one authenticated `POST /api/revalidate`.
The current Consistency dispatcher uses the POST for committed tag changes.
Startup, the page-cache agent and maintenance use the same server transport for
explicit page and layout paths.

## Changes

- Require `HOST_SERVICE_REVALIDATION_SECRET` through
  `X-HOST-REVALIDATION-SECRET` and validate the payload before invalidation.
- Accept bounded tag batches, a relative `path` with optional `type`, or both.
  The shared server transport deduplicates tags, batches requests and reports
  non-success responses to the caller.
- Remove GET, the 404/405 fallback and the extra Host request after each HTTP
  write. Keep browser notification delivery. The dispatcher retries failed
  invalidation without acknowledging the outbox batch.
- Remove the direct browser action for the internal route. Warm concrete
  localized pages by their pathname. Provide the secret through local bootstrap
  and the API and Host deployment templates.

## Verification

- Scoped Host, middleware, agent and secret-strength Jest suites.
- Actual Next Host HTTP smoke and the shared Bun transport. GET returns 405,
  missing or incorrect credentials return 401, malformed payloads return 400
  and authorized tags and paths return 200.
- Production Next fixture with warmed cache. A rejected POST leaves the cache
  intact, a tag POST refreshes both matching pages and a path POST refreshes
  the selected dynamic URL.
- Two WebSocket clients and a warmed HTTP cache over isolated local Redis.
- Type checks for changed packages, module dependency check and local bootstrap
  with matching generated API and Host credentials.

## Downstream migration

Generate a server credential for each environment and set the same
`HOST_SERVICE_REVALIDATION_SECRET` on API and Host within that environment.
Refresh both deployment environment files before rollout. Move project-owned
callers to the authenticated POST and the shared server transport.
See the [deployment guide](../../../tools/deployer/README.md#host-revalidation-secret).
