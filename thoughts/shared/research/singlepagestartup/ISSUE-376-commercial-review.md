# ISSUE-376: commercial input and preservation evidence

State: **prepared, not applied**. The independent review and the legacy Order
reader correction remain prerequisites to application. This agent owns the
commercial input and this report; root owns application and runtime acceptance.

Input: `ISSUE-376-commercial-confirmed-input.json`, SHA-256
`8fe9e8874450d2bff7aa625a5ee4a9f3a0b6d907783c633fb44f462a7b20af52`.
The existing `platform-example-content.ts` prepared it through normal local
operator SDK reads. Its canonical private receipt is
`.git/sps-runtime/issue-376/commercial-before-v2.json`, prepared at
`2026-10-23T21:02:33.171Z`. The earlier receipt remains separately preserved.
All three commercial observation/receipt files use mode 0600. Their protected
payloads and Store credentials are excluded from this report.

## Terms and pack precision

Source: the user's ISSUE-376 conversation. Pro is monthly, costs USD 29 or
RUB 1900 and grants 5000 Token credits for each accepted paid cycle. Free
remains the internal initial grant of 3000, once through authentication.
One-time top-ups cost RUB 100/300/500/1000/3000 at RUB 0.13 per Token.
This input changes no consumption, admission, deduction or refund code.

The pack quantities use downward rounding to six decimal places. This is an
implementation choice for the repeating decimal conversion, not a new user
instruction or a change to consumption pricing. It credits no more than the
amount purchased at the specified rate. The existing consumption amount formatter
uses six decimals (`billing/route.ts:74–75`); balances and top-up attributes
continue through their existing numeric/string representations.

| Pack price, RUB | Base Token credits per pack |
| --------------- | --------------------------- |
| 100             | 769.230769                  |
| 300             | 2307.692307                 |
| 500             | 3846.153846                 |
| 1000            | 7692.307692                 |
| 3000            | 23076.923076                |

Each pack is an ordinary `one_off` Product with a Price attribute linked to RUB
and a Topup attribute linked to Token. Paid quantity multiplies the configured
base amount through the existing fulfillment operation. Existing referral
behavior is unchanged. The packs do not receive the Pro Role association.

## Concrete saved graph

The input contains 76 targets: 70 new records and six existing switches.
Fourteen fresh Attributes supply Pro's two prices, monthly interval and 5000
allowance plus five pack prices and five pack credit amounts. Their key and
Currency associations are explicit. Five Store-to-Product links have
deterministic, unique SKU values.

Pro retains Product `e939ed88-22ba-4630-86e4-9743ad94338c` and slug `pro`.
Four existing Product-to-Attribute relations point to the fresh attributes:

| Existing association                   | Previous configuration | New configuration |
| -------------------------------------- | ---------------------- | ----------------- |
| `578a214d-3efa-4e87-8584-4f1a145ff30c` | 1 Telegram Star        | USD 29            |
| `83f8e774-3e6a-47f9-a589-f566694736b4` | RUB 1000               | RUB 1900          |
| `7f413699-39e9-465a-aef2-cd8db92f33d0` | minute                 | month             |
| `92527157-52e8-4533-88f7-5b0d178e6876` | 300 Token              | 5000 Token        |

The original Attributes and their key/Currency links remain unchanged and
protected. Pro copy describes the confirmed terms; its type remains subscription.
There is no new public Star price. Its existing Article and Role associations
remain protected. Free's Product, slug, price, interval, 3000 allowance and
existing ownership history are unchanged. No Free catalog membership is added.

A new `framework-commercial-catalog` Ecommerce Widget has eight ordered
members: Pro, five packs, Landing and Startup. The existing Landing and Startup
Products retain their IDs and USD 100/USD 2000 prices. The current two-member
catalog and its memberships remain protected. The existing RBAC-to-Ecommerce
owner association switches to the new Widget last. This keeps the additive
catalog preparation outside the active owner path; adding Pro directly to the
current catalog would expose its old price before the deferred attribute
switches complete. There is no new business variant or module layer.

## Current legacy observations and compatibility prerequisite

The prepared receipt protects all 41 Orders, 41 Order-to-Product links, 41
Store-to-Order links, 59 Invoices, 52 Payment Intents, current owner links, grants
and 19 wallet rows. Its 84 protected selections also cover original Attributes,
key/Currency links, Free configuration, existing Store memberships, the original
catalog, subscription references and the private Website Builder graph.
No target intersects a protected row.

There are seven Pro Orders: three new carts, one canceled cart, one delivered
history, one completed history and one requested-cancellation history. The
delivered/completed histories each have a paid Invoice for one Telegram Star.
The requested-cancellation history has an OPEN Invoice for one Star. Their
Payment Intents have type `one_off` and saved interval `minute`: transport type
does not turn the commerce Product into a one-time offer. All seven saved
Order-to-Currency amounts are the default string `0`; those values are not
evidence of a paid free purchase or a current valid quote.

The current freeze observation has **zero eligible Pro candidates**. The two
inactive paid histories must not gain a new period. The OPEN requested-cancellation
history must not gain entitlement. The private classification receipt is
`.git/sps-runtime/issue-376/commercial-freeze-observation.json`; its source
protected rows are identical to the final preparation's protected rows.

An owning Order reader correction is required before the four Pro association
switches. `find-by-id/extended.ts:240–244` currently calculates checkout attributes
using the saved Order Currency and the current Product prices.
`find-by-id/checkout-attributes.ts:216–268` rejects a Currency whose Product price
is absent. Removing Pro's Star price would therefore break old Star Order reads.
Keeping that price publicly purchasable would preserve the obsolete offer.

The correction belongs to Ecommerce Order: billed history reads use the matching
saved Invoice amount/Currency and saved supported interval, preserving the
subscription Product semantics even for a `one_off` Telegram Payment Intent.
Unpaid history remains readable without an accepted period. An unbilled old cart
may expose its saved amount as read-only historical state, but it must never
turn default zero into a payable quote. Fresh checkout continues to require the
currently configured USD/RUB prices and rejects Star. Root assigned this bounded
source correction and its regression cases to a separate agent. This report
does not accept an unreviewed correction or claim those runtime cases passed.

## Apply, freeze and rollback sequence

1. Deploy and independently review the owning Order compatibility correction.
   Verify old paid and OPEN Star history reads and strict new Star checkout
   rejection. No placeholder Star price or paid-zero fallback is permitted.
2. Stop competing CMS, authentication, billing job and webhook writers for the
   selected local API origin. Re-read the actual Pro Orders, Invoice ownership,
   current grants and fixed fields. The maintenance flag acknowledges this
   condition; it does not stop API jobs or make the HTTP operations atomic.
3. If eligible active legacy Orders appear, freeze them **before** changing
   Product terms, through Subject SDK
   `ecommerceModuleOrderFreezeSubscriptionPeriod` with exact owner, Order ID and
   `expectedUpdatedAt`. The old canonical interval is minute. The owning service
   validates history type, active status, paid Invoice, complete grant, valid
   old clock and conditional write. Never write fixed timestamps through generic
   Order CRUD. Ambiguous ownership, missing grant, partial fixed state or clock
   conflict requires reconciliation; do not manufacture a period.
4. After any accepted freeze, prepare a new commercial receipt. Its financial
   observations must include the resulting fixed fields. The currently prepared
   receipt is valid only while its protected rows and existing targets remain
   unchanged. No freeze is needed for the observed seven Pro Orders.
5. Apply the reviewed input with the existing tool under maintenance, retaining
   the same progress receipt after an uncertain response. It creates the new
   configuration and catalog, switches Pro's four associations/copy, then
   switches the exact catalog owner. It calls no checkout, proceed, payment,
   token grant, cancellation or revoke operation.
6. Read back prices, monthly interval, 5000 allowance, all five pack quantities,
   Store SKUs, exact catalog selection and unchanged protected observations.
   Repeat apply and a fresh prepare must need zero writes. Root owns actual
   checkout/fulfillment, browser, cache and runtime acceptance.

Rollback restores the six changed existing records and keeps additive records,
using the existing tool's version checks. It must refuse after protected
financial observations have changed, including a new purchase, Invoice, grant
or balance. Do not roll back real credits, accepted periods, paid amounts or
security classification to make a visual rollback succeed. Restore only a
configuration whose protected observations still match; otherwise reconcile
through the owning maintenance flow.

## Preparation evidence and limits

The normal SDK snapshot and both tool preparations are read-only at the API.
The final prepared input exactly matches the tracked JSON; its protected rows
are identical to the earlier receipt. Offline data-shape validation against the
owning SDK insert schemas checked all 76 target payloads with no errors after
adding the required Store/Product SKUs. This was input validation, not a test
suite or a type/build check.

Final preparation command, exit 0 in about 0.3 seconds:

```sh
API_SERVICE_URL=http://localhost:4000 bun --env-file=apps/api/.env run --tsconfig-override ./tsconfig.base.json tools/runtime/platform-example-content.ts prepare thoughts/shared/research/singlepagestartup/ISSUE-376-commercial-confirmed-input.json .git/sps-runtime/issue-376/commercial-before-v2.json
```

Local TCP and private receipt writes used the approved sandbox override. Bun
also emitted its nonfatal tsconfig directory-mismatch diagnostic; the command
returned exit 0 and the mode-0600 receipt read back with the expected input.
The first default-sandbox snapshot attempt could not reach the API and performed
no writes. No apply, freeze, tests, TSC, Nx, compiler, browser or server was run
by this agent. Live behavior, independent acceptance, application, repeat and
rollback remain unclaimed.

## Root acceptance after the source checkpoint

Local commit `18f454fef1` contains the implementation and bounded client-boundary correction; hooks performed formatting only, and its actual downstream trailers validate. No push or PR was created.

The serial Order regression command passed all45 tests in3 suites in1.982seconds, with Node heap1536MiB. It covers saved Invoice/interval projection, retired-currency checkout rejection and fixed subscription periods, including the independent cross-currency correction. The attempted nice adjustment was unavailable in the sandbox; the test process completed and exited.

Actual SDK reads succeed for all7 existing Pro Orders before and after the price change. Their type/status classification still matches the zero-candidate legacy-freeze observation. A fresh protected preparation matches all84 independently reviewed selections/669 rows exactly. No fixed period needed freezing; inactive paid and OPEN cancellation histories gained no entitlement.

Commercial publication through the maintained local SDK tool:70 additive records and6 existing updates; verify passed. Repeat skipped76 operations with zero writes; fresh preparation required0 operations. Rollback restored6 existing configuration records while retaining additive records, then a fresh prepare found6 updates. Reapply performed0 creates/6 updates and verification passed. Final terms are Pro29USD or1900RUB per month for5000 tokens, five RUB top-ups at the existing0.13RUB/token rate, and the two service examples. Financial observations, original Product/Attribute records and the protected Article graph are unchanged. No checkout, payment, token grant or notification was performed by publication. Private receipts remain mode0600 under `.git/sps-runtime/issue-376`.

Host and full production acceptance remain held after the thermal report. API continues on4000 through `npm run api:dev`. Exact320px, complete authenticated browser transitions, post-checkpoint Host compilation and a completed production build remain open. The issue remains In Dev; these results do not claim final Code Review readiness.
