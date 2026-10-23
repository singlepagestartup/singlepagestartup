# ISSUE-376: independent commercial input and Order compatibility review

Scope: `ISSUE-376-commercial-confirmed-input.json`, its author report
`ISSUE-376-commercial-review.md`, the read-only private preparation
`commercial-before-v2.json`, and the owning Ecommerce Order compatibility
change in `find-by-id/extended.ts`, its regression source and Order README.
The reviewer did not author this input or backend change. The review applies
the canonical `review-pr` workflow and approved Round 2 preservation rules.

State: **source review PASS for the commercial input and bounded Order
compatibility correction**. Application and runtime acceptance remain pending.
No data application, server, test, type checker or build was started by this
reviewer. Further checks remain held for root's controlled verification; this
review does not authorize a full build restart.

## Resolved P2 — payment interval and accepted Invoice used different currency scopes

Evidence in the earlier reviewed revision: established source path, not a
reproduced current-record failure.
`libs/modules/ecommerce/models/order/backend/app/api/src/lib/service/singlepage/find-by-id/extended.ts`
filtered the receipt candidates to the primary Order Currency, then took its
selected Intent's saved interval. The unchanged
`subscription-period/index.ts` `paymentContext` selects the latest paid Invoice
from all of the Order's Intents without that Currency filter.

An additional newer paid Intent in another Currency with a different interval
could therefore pair one payment's accepted anchor with another payment's
interval.
The prepared saved Pro graph does not establish this conflicting context;
frequency is unknown. The compatibility change is a reusable Order read, so
the mismatch required a source correction.

The current `checkoutPresentation` rejects a paid Invoice on any Intent whose
resolved Currency set omits the Order's saved primary Currency, before filtering
candidates. The existing matching-plus-extra-Currency check also rejects an
ambiguous Intent. Every paid Invoice that can reach the period consumer now
belongs to the same primary-Currency scope as the receipt selector. Both select
the newest paid Invoice by creation time and ID. No period or fulfillment source
was changed by this correction.

The regression source adds a newer RUB/month Intent beside the accepted
Star/minute context. Its paid case requires the mismatch error; its OPEN case
retains the original amount, subscription type, minute interval and accepted
anchor. Both cases require unchanged fixture state. Strict checkout still uses
the unchanged current-price command, which rejects the retired Currency. This
reread resolves the source finding; the regression cases remain unexecuted.

## Accepted commercial input

The tracked input hash is
`8fe9e8874450d2bff7aa625a5ee4a9f3a0b6d907783c633fb44f462a7b20af52`.
Its prepared input matches the tracked JSON. The private receipt is mode 0600
and remains prepared. Its protected row values were not copied into this report.

The confirmed terms are monthly Pro at USD 29 or RUB 1900 with 5000 Token
credits per accepted paid cycle, plus one-time RUB 100/300/500/1000/3000 packs
at RUB 0.13 per Token. Each pack's base quantity matches downward rounding of
that conversion to six decimal places. The author report identifies this
precision choice separately from the user's terms. Consumption, deduction,
admission and refund rules are outside these targets.

The 76 prepared operations comprise 70 additive creates followed by six existing
switches. Every target requires commercial confirmation, every reference points
to an earlier target, and no operation intersects the 84 protected selections.
Pro keeps its Product identity and subscription type. Four exact existing
Product-to-Attribute links select fresh Price, interval and Topup records;
original Attributes and key/Currency links remain protected. Its existing Role
and private Article associations are outside the write set.

Each of the five new packs has `one_off` type, an explicit RUB Price link, a
Token Topup link and a unique Store SKU. No Pro Role is attached to a pack and
Free is absent from the catalog membership set. The new curated catalog orders
Pro, the five packs, Landing and Startup. Landing and Startup retain their
existing identities and USD prices. The existing catalog is protected; its
exact RBAC owner association switches last, after all new records and Pro
configuration switches.

Protected observations cover Orders, order lines and currencies, Payment
Intents, Invoices, ownership, grants, wallets, original configuration and the
private content graph. The input performs no purchase, settlement, delivery,
grant, period freeze or financial rollback. The report's maintenance requirement
is an operator precondition, not a claim that separate HTTP writes are atomic.
Any eligible legacy period must be frozen through its owning command before
changing terms and followed by a fresh preparation. Protected drift must stop
apply or rollback rather than rewriting financial history.

## Remaining Order source behavior

The compatibility read hydrates the same owning
Service graph and returns no mutation. Matching saved Invoice amounts replace
current catalog amounts for billed history. A supported saved Intent interval
preserves a Telegram one-off payment's subscription delivery semantics; the
Product still owns the commerce type. A sole unpaid context remains unpaid and
does not acquire an accepted anchor. Missing accepted anchors, duplicate Invoice
contexts and multiple unpaid contexts fail closed.

An unbilled new cart first requests the current configured quote. Only the
specific missing-target-price failure permits its saved Order-to-Currency
amount to appear in an extended read. The strict checkout-attributes command
is unchanged and still requires a configured price for the selected Currency.
The fallback therefore supplies no accepted zero-price checkout or credits.
The initial Free zero settlement retains its Product interval. This source
review does not replace checkout, access or fulfillment runtime tests.

The new regression source covers historical paid and OPEN receipts, saved
amounts, fixed anchors, current versus retired Currency quoting, the Free
contract and corrupt payment graphs. It has not been executed by this reviewer.
Root still owns focused execution,
readback, unchanged protected observations, repeat/fresh-prepare zero writes,
rollback limits and browser acceptance. Those checks remain pending. This
verdict does not approve the reviewer's own UI, the complete implementation or
a workflow status transition.
