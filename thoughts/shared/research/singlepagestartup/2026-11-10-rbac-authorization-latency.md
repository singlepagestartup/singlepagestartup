# RBAC authorization: startup policy, transport and measured latency

Date: 2026-11-10. PR: #341, issue: #308. Measurement base: `4b6957cdd8`.

## Current behavior and proposed composition

`API_CORS_ALLOWED_ORIGINS` remains optional. An absent or blank value permits
ordinary HTTP(S) origins. A nonempty comma-separated environment value is parsed
into a list and matched exactly. Opaque and malformed origins remain excluded.
No domain restriction is added to an empty deployment configuration.

Keep exact public authentication entry points in framework middleware: session
initialization, login, registration, refresh, logout and the supported OAuth
operations. They must not need permission rows to reach their handlers after
schema migrations on an empty installation. Their handlers still validate
passwords, tokens, state and other operation-specific inputs. Creating the first
administrator remains a trusted setup operation; it does not grant admin rights
to the first anonymous visitor. The authorization-check endpoint can keep its
exact exception as well.

For ordinary domain routes, the target design is one permission resolver in RBAC.
The global middleware receives the existing Subject authorization service as a
constructor dependency, assembled by `apps/api`. Startup service overrides stay
in effect. Middleware extracts the request context and calls the service; it
does not contain permission queries or ownership logic. HTTP callers can retain
the existing authorization controller, which delegates to the same service.

The transport change must preserve rejection of an invalid operator credential,
JWT verification/revocation, error categories, consistency dependencies and
project-specific rules. It must not add a second permission implementation or
a new repository layer. Internal Observer channel reads should authenticate as
service calls rather than depend on anonymous access to the channel list.

Ownership checks are the existing Subject routing model: compare the Subject
in the token with the Subject in the URL, then validate relations to the requested
Profile, Chat, Order or other object. A URL containing a Subject id does not itself
prove those relations. Preserve these checks in their owning RBAC operations and
module middleware; they complement route permissions.

The direct service invocation described here is a benchmark prototype, not yet
the production middleware implementation. The current PR still uses the SDK's
internal HTTP call. The implemented follow-up is the JWT-expiry cache fix below.

## Measurement method

- Local Bun, real PostgreSQL and Redis; a temporary Subject with an Admin role.
- A protected HTTP GET runs the existing authorization middleware, reads one
  permission row through its existing service and registers consistency metadata.
- Compare the original SDK HTTP authorization call with an in-process call to
  the same startup-resolved Subject service. Only this transport is substituted
  in the scratch harness; application source is unchanged by that substitution.
- Cold authorization clears in-process caches between requests. Connections and
  table-coverage information are already initialized. Warm requests reuse the
  authorization decision and validate its database dependency versions.
- A local TCP proxy adds delay in both directions of the PostgreSQL connection.
  Added round-trip delay is 0, 2, 10 or 40 ms. This models network latency, not
  geographically deployed servers, packet loss or cross-region failover.
- A `SELECT 1` calibration measured median round trips of 1.19, 2.92, 12.99 and
  46.60 ms respectively. The first calibration's connection setup is excluded
  from interpretation of steady-state latency.
- Samples per mode: 20 cold, 60 warm and 100 requests at concurrency 10 without
  added delay; 10 cold, 20 warm and 30 at concurrency 10 for each delayed case.
- SQL commands are counted through the client's debug callback without storing
  parameters. Credentials, JWTs and customer records are not included here.

## Sequential request results

Values are medians in milliseconds for authorization, the sample data read and
consistency metadata together. These are local measurements, not production SLOs.

| Added PostgreSQL RTT | HTTP, cold | Direct, cold | HTTP, warm | Direct, warm |
| -------------------- | ---------: | -----------: | ---------: | -----------: |
| 0 ms                 |      41.84 |        18.81 |       4.57 |         3.33 |
| 2 ms                 |     111.25 |        97.57 |      19.94 |        18.91 |
| 10 ms                |     405.59 |       360.10 |      69.68 |        70.00 |
| 40 ms                |    1405.40 |      1274.69 |     238.57 |       245.49 |

Without injected delay, cold p95 was 130.12 ms for HTTP and 23.30 ms for direct;
warm p95 was 10.16 and 5.43 ms. At concurrency 10, warm p50/p95 was 8.63/57.13 ms
for HTTP and 8.07/10.92 ms for direct. Background processes and sample size affect
the tails; this is not a maximum-throughput test.

Cold requests used 17 SQL commands through HTTP and 14 through direct invocation.
Both used eight domain reads and four version reads. The HTTP path added one
consistency status read and two query-registry operations. Warm sequential
requests used four commands in both modes: version validation, the requested
domain read, consistency status and query registration. SQL command count is not
identical to network round-trip count, so multiplying it by RTT is only a rough
model; the delayed measurements include the driver's actual protocol exchanges.

For comparison, the running full API, with its ordinary middleware stack and
warm caches, answered `GET /api/rbac/permissions?limit=1` at p50/p95 5.94/9.23 ms
for 50 sequential requests and 12.04/73.49 ms for 100 requests at concurrency 10.
The harness and full API do not have identical middleware overhead.

## Interpretation

For each request, total time comprises client-to-API transit, application work,
database exchanges, queueing and response transfer. A cold authorization through
HTTP adds another API trip and another consistency-registration cycle. A direct
service call removes those parts, but it cannot remove PostgreSQL latency.

Every API instance already contains RBAC code. With direct invocation, a request
does not need another API replica to authorize it. Replica-to-replica distance is
therefore not the controlling parameter; distance from each replica to the
authoritative database is. Redis does not replace PostgreSQL's proof that cached
permissions remain current.

On this local setup, a warm protected request takes several milliseconds.
With 40 ms of additional database RTT it takes roughly 240 ms warm and more than
a second cold. Those delayed cases can be noticeable on pages with dependent
request chains. Parallel widget requests do not simply add all their latencies,
but sequential dependencies and connection-pool queueing do add time.

Keep API and its authoritative database close. Optimize repeated service reads
and version validation within the current service/consistency contracts before
introducing custom SQL or a permissive authorization cache. A long cache TTL
alone must never keep a revoked role or expired token authorized.

## Two-process cache verification and implemented fix

Two independent Bun processes, with separate in-memory caches and one PostgreSQL
database, ran the protected route: one through HTTP authorization, one through
direct invocation. Both cached a successful decision for the temporary Subject.
Neither process used the background invalidation listener in this test, so the
check exercised validation against current database versions.

After removing the role through the running API, both next requests returned
403 before the 30-second cache lifetime elapsed. After the mutation completed,
the two final checks completed together in 33 ms on the local machine. This
does not measure a geographically distributed deployment or an in-flight request
that was already authorized before revocation.

A separate short-lived, correctly signed access token exposed a defect: both
processes returned 200 after its expiry while the positive decision was cached.
The middleware now checks `exp` before reusing a decision and sends expired or
unparseable tokens through the normal authorization path. It does not use decoded
claims to grant access. Both processes now return 401 after expiry.

The regression test advances time by six seconds for a token expiring after five,
within the 30-second decision-cache lifetime. It failed with 200 before the fix
and passes with 401 afterward. All 92 middleware tests and its TypeScript check
pass. The temporary Subject and role link were deleted, and benchmark processes
were stopped. No schema, seed snapshots or production deployment was changed.
