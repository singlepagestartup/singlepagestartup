# Revalidation transport

Host mounts Revalidation once in `apps/host/app/layout.tsx`, so every Host page,
including account settings, shares one `/ws/revalidation` connection. React Query owns API results;
`globalActionsStore` holds compact consistency diagnostics and legacy events. Entity
bodies never travel through this shared socket.

## Query capabilities

A tracked API GET returns `x-sps-consistency`, a base64url JSON header containing
protocol version 1, epoch, an opaque query ref, cursor and lease expiry. Its full
dependency descriptor remains in PostgreSQL. Refs are bound to the request's
hashed authorization partition. Operator-secret responses are service-only.

The shared SDK transport registers metadata after successful JSON parsing. The
query lifecycle matches the full URL/params and API origin; keys also separate
principals. Host subscribes active query refs with the current JWT and replay
cursor. The server verifies the JWT and the ref's partition. A Thread ID alone
never grants a subscription.

The server compares each ref's observed versions on every subscribe, even when
the connection cursor has advanced through another query. This covers a GET
that completes after a newer notification. Invalidation frames carry only refs,
epoch and delivery cursor. Active matching queries refetch; inactive cached
queries become stale without an immediate request. Repeated invalidations share
one fetch and a pending follow-up flag.

A ready frame identifies the refs accepted by the connection. Legacy topic and
route invalidation is suppressed only for those queries while their lease is
valid. Up to 100 active refs use a subscription frame; additional queries retain
legacy matching and participate in batched recovery checks.

## Recovery and access

Heartbeat and lease renewal run every 15 seconds. Dispatcher lag above two
seconds reports degraded even while the socket is open. A visible online tab
checks authoritative query versions every 15 seconds while disconnected,
degraded or missing heartbeats. Focus, online and visibility restoration force a
check. Two missed heartbeats close the socket; reconnect uses exponential
backoff and jitter.

The version-check endpoint does not depend on outbox delivery progress. Old or
missing refs, an expired cursor and epoch changes cause addressed resync.
Invalidations are queued before the browser advances its cursor. A new browser
load starts with fresh reads; sessionStorage does not restore entity data.

JWT checks recur during socket renewal. Changed access dependencies force a
fresh authorized read. A 401/403 reconciliation clears previously loaded query
data. Login, logout and a changed principal reset old subscriptions and cached
queries. Background refresh keeps mounted component state, focus and scroll position.
The transport does not save forms or drafts. Entity data stays in React Query;
a draft stays in its component's local state unless its owning feature saves it.

The site-wide status becomes visible after five seconds without a connection or
when dispatcher lag exceeds two seconds. A closed socket shows "Reconnecting.
Updates may be delayed." An open socket with lag shows "Updates are delayed.
Checking for changes." A healthy connection keeps the status visually hidden.
This feature makes no AI provider requests.

## Legacy compatibility

`RevalidationMiddleware` broadcasts successful HTTP mutations as `slug:
"revalidation"`, with route, topics and timestamps. The database runtime also
bridges direct service/CLI writes to collection topics using the generated
resource catalog. Existing legacy topic rules expand known aggregate
notifications for old bundles; the new dependency engine does not use that
map. Old clients retain their route/topic subscriptions. These
frames contain no record IDs from private dependency descriptors.

Legacy middleware remains before its HTTP-cache adapter so its awaited version
bumps finish before broadcast. In the new path, PostgreSQL generations determine
API freshness; dispatcher retry handles Next tag invalidation before delivery.
Ordinary messages do not call router.refresh, reload or root-layout invalidation.

`SPS_CONSISTENCY_MODE` defaults to `compatibility`. `enabled` uses the same
protocol; `observe` compares cached candidates with fresh reads and omits browser capabilities; `off` omits read
tracking. The committed-write bridge continues in all modes. HTTP response
caching is separately opt-in through `MIDDLEWARE_HTTP_CACHE=true`.

## Next tag delivery

The dispatcher deduplicates tags and sends sequential POST batches of at most
128 tags to Host `/api/revalidate`. Host validates the bounded payload and
acknowledges after calling `revalidateTag` for every tag. A 404/405 from an older
Host falls back to serial legacy GET requests. Other failures keep the outbox
batch pending for retry with backoff; they never acknowledge undelivered events.

Next delivery failure does not stop socket heartbeats or pumping previously
delivered events. Browsers can still check authoritative query versions while
the outbox catches up. Operator diagnostics include pending count, lag,
dispatch failures, retry time and `lastError`; the latter is not sent to browsers.
