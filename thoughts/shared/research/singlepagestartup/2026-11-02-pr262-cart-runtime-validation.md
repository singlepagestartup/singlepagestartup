# PR 262: cart compatibility with current main

Base: `762af4f51b503641de9ced48bcf0acdedae27e2f`.
Original PR head: `7ce5dda2caf13464f5ccd96c0a3f7abf8338c3f1`.
Environment: Node 24.11.0, Bun 1.3.6, Next 16.4.3, React 19.3.1,
local PostgreSQL/Redis and the existing checkout environment.

## Integration and behavior

Merging main exposed 12 conflicting paths. Retain main's injected backend
services, write transaction, ownership middleware, consistency snapshots and
current form/layout. Do not restore retired HTTP cache route files or add a
second ownership service.

Resolve the requested/default price currency before the create transaction.
A Product with no price currency, or an unsupported requested currency, answers
400 before creating an Order or its associations. The Initial Free restriction
from main remains in the handler.

Internal line/order totals now return `{ totals, unpriced }`. Update every
consumer, including the current cart projection and purchase history. Both
keep `totals` as an array; optional `unpriced` diagnostics identify incomplete
lines. HTTP total routes retain the amount array under `data`, with diagnostics
beside it. Existing SDK total readers continue returning the `data` array.

The Product currency selector reports completed empty intermediate relations as
well as resolved currencies. The current Subject form stays disabled while
loading and displays “No price” / «Нет цены» when unavailable. Changing Products
resets the submitted Product/currency inputs. The cart retains unpriced rows for
removal, shows a warning and disables checkout until they are removed.

## Verification

- RBAC: 184 suites, 1030 tests passed.
- Ecommerce: 25 suites, 126 tests passed.
- Middleware: 12 suites, 57 tests passed.
- Host: 10 suites, 55 tests passed.
- Total: 231 suites, 1268 tests passed. The two form suites were rerun after the
  final test-import lint fix: 9 tests passed.
- Targeted ESLint and changed-file Prettier passed after correcting the two
  test imports. Diff whitespace checks passed.
- Module boundaries: 15513 source files, zero violations.
- Full production Webpack build passed compilation, TypeScript, prerendering and
  tracing. Local flags: `NODE_OPTIONS=--max-old-space-size=8192`,
  `SPS_HOST_BUILD_CPUS=1`, `SPS_HOST_WEBPACK_CACHE=false`, Nx cache bypassed.
- The broader RBAC module `tsc --noEmit` includes test files and reports the
  same 63 diagnostics on main and on the final branch; comparison normalizes
  line/column positions and finds zero new diagnostics.
- The placement checker retains main's existing Studio `Files.tsx`/`Files/`
  collision. This PR introduces no such collision.

### Real API

Temporary catalog records were created through the local API, without editing
repository snapshots. An unpriced add returned 400 and the Order count stayed
unchanged. A priced Product with an unsupported currency also returned 400.
The supported priced add succeeded.

For single-order total and quantity, ordinary guest JWT requests returned 200
for the owner, 403 for another subject's Order, 403 for an unknown Order and 400
without a session. The total response retained an array and the expected amount;
quantity retained its numeric value. No operator-secret bypass was used in
these owner/foreign/anonymous request checks.

A temporary legacy unpriced Order returned HTTP 200 with an empty `data` array
and one `unpriced` diagnostic.

### Browser

Run API and Host from the integrated branch. In Turbopack dev:

1. The unpriced Product rendered a disabled «Нет цены» button.
2. Adding the priced Product updated the cart; its amount was 150 RUB.
3. Increasing quantity to two updated its amount to 300 RUB and the cart sum.
4. Creating a legacy unpriced line through another API client updated the open
   cart without a page reload. The priced amount remained visible, a warning
   appeared and checkout became disabled.
5. Removing that temporary line cleared the warning and enabled checkout.

Start the built production Host on the same local API. The unpriced button,
priced add, cart amounts and removal worked. Account settings → Purchases
rendered the existing paid purchase and its receipt link. The browser error log
was empty. Existing user cart positions were retained.

Temporary Products, attributes, associations, guest Subjects and test Orders
were deleted through the API after verification. The user's three pre-existing
checkout changes were preserved byte-for-byte. No payment was submitted and no
provider transaction or Docker image build was tested.

## Environment limits

An initial Jest run exhausted disk space. Remove reproducible build caches from
the earlier checks and obsolete temporary dependency trees, then rerun all
four scopes successfully. This was an environment failure, not a passing test.

## Downstream migration

Owned consumers of internal `getTotal`/`findByIdTotal` must select `totals` and
preserve `unpriced` diagnostics. Keep arrays in cart/purchase projections and
HTTP `data`; do not serialize the whole internal result into those fields.
Reuse the current injected services, transaction/snapshot scopes and ownership
middleware. Update old form overrides to the current currency availability
callback and reset inputs when switching Products. Keep unpriced rows removable
and block their checkout. Verify owner and foreign reads, unpriced rejection
without writes, mixed cart rendering, quantity changes and production SSR.
