# ISSUE-376: numeric Token attribute key correction

State: **independent source review PASS; local application and readback PASS**.

The six managed credit Attributes already store the correct amounts in `number`
and link to Token Currency. Their shared legacy Topup Key declares
`field="string"`, which directs the UI to their empty localized string values.
The resulting dash is a data-contract mismatch. Fulfillment selects a key whose
type is topup and explicitly reads `attribute.number`
(`Proceed.collectTopupCurrencies`, lines 539–557). The UI continues to use the
declared field; this correction changes no frontend or consumption code.

## Exact changes

One new `ecommerce.attribute-key` record:

```json
{
  "slug": "token-credit-topup",
  "variant": "default",
  "adminTitle": "Token credit top-up",
  "type": "topup",
  "field": "number",
  "title": { "en": "Tokens", "ru": "Токены" }
}
```

The owning SDK insert schema accepts this payload. Six existing
`ecommerce.attribute-keys-to-attributes` rows change **only** `attributeKeyId`
to its server-assigned ID:

| Managed Attribute slug        | Existing association ID              |
| ----------------------------- | ------------------------------------ |
| ai-chat-pro-topup-5000        | 01edc8c0-d9a4-41c8-b5c2-e017fe8cd217 |
| ai-chat-tokens-100-rub-topup  | 9be020bf-d960-4975-b185-bdb42406b793 |
| ai-chat-tokens-300-rub-topup  | f0a4c2d2-2858-4bad-a1b2-a0eff38c0ee5 |
| ai-chat-tokens-500-rub-topup  | afa4d198-516b-40e6-87d6-50abbb53b517 |
| ai-chat-tokens-1000-rub-topup | e5feca52-91de-49dd-9b38-cb46050a6fe5 |
| ai-chat-tokens-3000-rub-topup | 89c8d5e2-fc03-4ccd-b3c7-a26076b3637e |

The old shared Key `e005389b-41c4-4efb-89a2-6d84a354cfed` and its string
declaration remain unchanged. Free, original Attributes, paid records, numeric
amounts, Token Currency links, Product-to-Attribute links and commercial prices
are outside this correction.

## Inputs and preparation

The tracked `ISSUE-376-commercial-confirmed-input.json` now has 77 targets.
The new Key precedes all six references. Those six targets pin their existing
association IDs and stable Attribute IDs, so replay updates the original links
without creating duplicate associations. The other commercial targets retain
their previous data.

Its SHA-256 is
`1a3edddb6f7efc6ace65ea5791dd6fb66fa87f2c5874ad05401ed10e7e9bd385`.

The separate bounded input is `ISSUE-376-commercial-topup-key-input.json`,
SHA-256 `0219ce119476ced74192c298aa678cbfc755f4ad149024c489539af5d0ef05a5`.
It contains exactly one create and six existing-row switches, retaining all 84
protected selections from the commercial input. Existing Attribute Keys are
protected by explicit individual IDs; there is no collection-wide Key guard
that would conflict with the new Key.

Normal SDK reads observed six managed Attributes, one existing association per
Attribute and no `token-credit-topup` Key. The maintained tool then prepared
`.git/sps-runtime/issue-376/commercial-topup-key-before.json` at
`2026-10-23T21:38:08.662Z`. The snapshot and receipt use mode 0600. Their protected
rows and operational values are excluded from this report.

```sh
API_SERVICE_URL=http://localhost:4000 bun --env-file=apps/api/.env run --tsconfig-override ./tsconfig.base.json tools/runtime/platform-example-content.ts prepare thoughts/shared/research/singlepagestartup/ISSUE-376-commercial-topup-key-input.json .git/sps-runtime/issue-376/commercial-topup-key-before.json
```

Preparation returned exit 0 in about 0.53 seconds: seven operations, one create,
six updates and 84 protected selections. Each update payload contains only
`attributeKeyId`. The receipt exactly matches the bounded input. There are zero
protected-row intersections and zero forward-reference errors. Bun also emitted
its existing nonfatal tsconfig directory-mismatch diagnostic.

The independent addendum in `ISSUE-376-final-source-review.md` accepts the exact
bounded input and its prepared receipt. Root applied one Key create and six
association updates through the maintained SDK tool. Verification passed with
all 84 protected selections unchanged. A repeated apply skipped all seven
operations and performed zero writes; fresh preparation in
`commercial-topup-key-after.json` returned zero operations. Browser verification
of the displayed Tokens amounts remains open. The existing tool's
rollback can restore the six original Key references while retaining the
additive Key, provided its drift/protected checks still pass. No apply, API
mutation, test runner, TSC, build, server or browser was run by the input author
or independent reviewer; the application results above belong to root.
