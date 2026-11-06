# Cart checkout currency

Date: 2026-11-02. Base: main `912a112c0541f0a3cc1a3a942b2b1b8c114539a5`.
Branch: `codex/cart-checkout-currency`.

## Reproduced cause

The existing Pro cart contained three units. Its saved Order–Currency link
pointed to Telegram Star, while current Product prices offered USD and RUB.
Checkout reads the saved currency and failed with
`Not Found error. Product does not have any target price attributes`.
The sheet displayed both alternative amounts and provided no currency selector.
An empty receipt email also prevented form submission without an inline summary.

## Correction

The authorized cart projection includes its saved currency and the intersection
of current price currencies across every Order line. Each Order has an explicit
currency selector; rows and footer show the selected amounts. An obsolete or
missing selection blocks checkout and asks the customer to choose a currency.

The existing Subject order-update route accepts a currency-only payload. Its
service checks ownership, locks an active cart Order, validates all Product
currencies before writing, and normalizes currency links within one transaction.
It creates no invoice or payment. Checkout remains blocked during cart updates
and refreshes. Form validation and API failures appear inline.

## Verification

- RBAC: 186 suites, 1051 tests passed, including ownership, active-cart checks,
  invalid currencies, duplicate links, real form validation and API rejection.
- Ecommerce: 26 suites, 128 tests passed, including common-currency calculation
  and unpriced-line behavior.
- Host production TypeScript configuration: `tsc --noEmit --incremental false`
  passed. RBAC module TypeScript: the same 63 pre-existing test diagnostics as
  the main baseline; no new diagnostics after normalizing source line numbers.
- Module dependency check: 15517 source files, zero violations.
- Local API with a temporary guest and Product: RUB/USD updates returned 200;
  saved currencies matched read-only checkout quotes of 100 RUB and 10 USD for
  quantity two. Unsupported Stars returned 400 without changing the selection;
  a foreign Order update returned 403. No payment association was created.
- Browser with API and Turbopack Host: a temporary cart line changed from 5 USD
  to 50 RUB. A second client's currency-link update changed the open sheet back
  to 5 USD without reloading. The original Pro Order requires USD/RUB selection.
- Temporary catalog, guest and Orders were removed. The original cart remains
  one Pro line, quantity three, status `new`, with its original saved currency.
  Pre-existing local changes in the Host manifest, lockfile and Nx configuration
  retain their original SHA-256 hashes.

## Limits

No payment-provider request, invoice creation or charge was performed. This
verification covers currency persistence, quote calculation, cart rendering and
error handling; it does not establish payment-provider credential validity.
The full ESLint run exhausted Node's default heap. Changed files use the same
ESLint rules with parser project loading disabled, alongside the separate
TypeScript checks above. The placement checker retains the pre-existing Studio
`Files.tsx` / `Files/` collision outside this change. No full production build was
repeated for this fix.

## Shadcn selector and payment grouping follow-up

The currency control uses the shared UI adapter's `Select ui="shadcn"`.
Browser verification showed its custom dropdown with USD and RUB options. The
original selection and quantities remain unchanged; the receipt email is empty
and the customer's selected `dummy` provider is retained.

The checkout service groups Orders by saved currency, purchase type and
subscription interval. A mocked-provider scenario with USD, RUB and another USD
Order produced two Payment Intents; only the matching USD amounts were added.
The current frontend redirects when there is one invoice URL. For multiple URLs,
it renders separate links with `target="_blank"` and performs no automatic
redirect. The four affected suites pass all 27 tests; changed-file ESLint rules
pass with project loading disabled as described above.

Multiple-payment presentation remains limited: links have identical labels and
are kept only in component state, without recovery after a reload. This check
does not establish their visibility after the active-cart reader becomes empty.
One provider is selected for the entire checkout; provider selection is not
automatically routed by currency. The `dummy` create operation returns a test
invoice URL pointing to the Host rather than a bank payment page. No provider
call or payment was performed during this follow-up.

## Checkout text localization

The checkout list selects RU/EN copy from its `language` prop. Form schema
validation, cart warnings, empty-cart copy, payment-link failures, field labels,
buttons and number formatting use that language. API error details are retained
verbatim after a localized checkout failure message.

The two checkout component suites pass all 14 tests, including real email
validation in Russian and English and an English missing-payment-link failure.
Changed-file ESLint rules and `git diff --check` pass. Browser verification at
`/en/framework` shows “Your cart is empty.” in the English sheet. No cart data or
payment was created for this localization check.
