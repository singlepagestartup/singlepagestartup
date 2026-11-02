# PayKeeper protocol completion

Date: 2026-11-02. Base: `28a316edc17c5c5a0216484280fdf2cb644ff7e6` (main).
Working branch: `claude/issue-230-paykeeper-validation`, fast-forwarded from its
previous head through current main before the checkout switch.

## Completed behavior

The shared pure PayKeeper verifier checks the merchant-seed digest before any
relation, Invoice or provider read. It normalizes the amount to two decimal
places without truncating cents, compares the digest with timingSafeEqual and
constructs the acknowledgment only for authenticated data. Required fields,
unsafe decimal forms and missing configuration fail closed.

The provider handler dispatches PayKeeper before the legacy zero-amount path,
returns the exact successful text body and does not log its headers or payload.
Dummy callbacks now refuse non-dummy Invoices, including zero-amount records.
The valid internal free dummy flow remains covered and working.

PayKeeper invoice confirmation uses authenticated GET against the configured
provider origin. Object and singleton-array responses are supported. The service
compares invoice ID, payment ID, order ID, client, paid status and amount with
the signed event and both stored billing records. Mismatch, unpaid or canceled
state produces no acknowledgment. Invoice response errors omit raw provider text.
The adapter rejects non-RUB creation before writing an Invoice.

Payment Intent and Invoice updates share one PostgreSQL transaction. Locks are
acquired in that order through their owning repositories/services. A repeated
successful event does not update either record again. A later write failure
rolls back the Invoice and leaves the operation retryable. No schema or data
snapshot changed. Existing paid/succeeded statuses are the replay markers.

Payment Intent DI now uses the effective initialized Currency, Invoice and
relation apps rather than constructing generic child repository services.
Concrete Invoice capabilities are exposed through its typed App/Controller and
Service. Module order is unchanged; the new helpers import no business module.

## Verification

- Billing: 7 suites, 36 tests pass.
- Shared backend utils: 10 suites, 190 tests pass, including an independently
  calculated UTF-8 signature/ACK fixture, signed-field tampering and exact decimals.
- PostgreSQL integration: 9 tests pass. Four simultaneous calls through independent
  repository instances produce one Invoice update and one Payment Intent update.
  A retry preserves timestamps. Payment-update failure rolls back both states;
  retry succeeds. Provider/amount/client/ID mismatches and canceled state write nothing.
- API scenario: 15 tests pass against an isolated Bun API, local PostgreSQL and
  a loopback PayKeeper fixture. The incoming callback has no operator credential.
  Forged callbacks return 403 before bank access; signed unknown UUID returns 404.
  Valid callbacks commit before an exact text/plain ACK; concurrent repeats retain
  the same state and timestamps. Warmed entity URLs return updated statuses without
  cache-busting parameters. Cross-provider dummy attacks fail for amounts 0 and 100;
  legitimate zero dummy settlement succeeds.
- RBAC: 187 suites, 1065 tests pass after the dummy boundary changes, covering
  the current purchase and Initial Free orchestration. Total: 1315 passing tests.
- Billing and backend-utils no-emit TypeScript checks pass. API retains 18 baseline
  diagnostics. TypeScript renders one existing File/Blob union in the opposite
  member order; diagnostic codes and affected paths are unchanged.
- Scoped ESLint: 19 TypeScript files, zero errors/warnings, with project loading
  disabled and separate typechecks. AST audit: zero inline type imports.
- Module dependency check: zero violations. SQL inventory: 11 reads with adapters;
  the two added row locks call trackRepositoryRead. No new raw fetch call site.
- Host opens `/ru/framework` in Browser on this branch. Main API/Host remain in
  their ordinary dev processes. No production Host build was repeated.

The API scenario owns and stops its test API and provider fixture, tracks every
created row and removes its fixtures in reverse order. Three records from the
initial create-status assertion were separately identified and removed after
checking their exact creation interval and absence of Invoice/currency/Order
associations. No existing customer cart or account was edited. No live provider
call, charge, refund or real notification was submitted.

## Middleware and downstream effects

Direct service writes preserve the ambient consistency transaction, row capture,
generations and outbox. The warmed API scenario exercises freshness after commit.
Action logging has no billing mutation rule and operator-only inner calls had
no Subject JWT. Search-indexing has no billing entity effect. Configured observer
messages were inspected without exposing headers/bodies: the current project
has an Order PATCH trigger and a dummy-webhook trigger, with no PayKeeper or
Invoice/Payment Intent PATCH trigger. Those existing flows remain unchanged.

Owned observer pipelines tied to the former internal HTTP PATCH requests need
migration to the committed payment lifecycle. Those transport-specific hooks
are not replayed inside a transaction or represented as separate successful
HTTP writes. Do not split atomic settlement back into self-HTTP calls.

## Merchant configuration and evidence

Set the existing PAYKEEPER_WEBHOOK_SECRET to the secret word configured for
POST notifications in the merchant account, and set the callback URL to the
PayKeeper webhook route. API credentials remain separate. The code and local
protocol are complete; an actual merchant callback was not sent and no account
settings were changed in this task.

Protocol sources checked 2026-11-02:
[POST notifications](https://docs.paykeeper.ru/metody-integratsii/priyom-post-opoveshhenij/),
[Invoice lookup](https://docs.paykeeper.ru/dokumentatsiya-json-api/scheta/).
