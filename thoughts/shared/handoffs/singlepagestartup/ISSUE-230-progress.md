---
issue_number: 230
issue_title: "Validate PayKeeper webhook identifiers before relation lookup"
start_date: 2026-09-18T23:26:05Z
plan_file: thoughts/shared/plans/singlepagestartup/ISSUE-230.md
status: complete
completed_date: 2026-09-18T23:29:49Z
---

# Implementation Progress: ISSUE-230 - Validate PayKeeper webhook identifiers before relation lookup

**Started**: 2026-09-18
**Plan**: `thoughts/shared/plans/singlepagestartup/ISSUE-230.md`

## Phase Progress

### Phase 1: Identifier guard in the service layer

- [x] Started: 2026-09-18T23:26:05Z
- [x] Completed: 2026-09-18T23:28:00Z
- [x] Automated verification: `npx nx run @sps/billing:jest:test` PASSED (16
      tests, 5 suites), `npx nx run @sps/billing:eslint:lint` PASSED,
      `npx nx run @sps/billing:tsc:build` PASSED

**Notes**: `validateWebhookIdentifiers` lives beside the provider services in
`service/singlepage/webhook-identifiers.ts` and takes field lists, so the other
provider branches can adopt it without a new package. It uses the same
`validate` predicate from `uuid` as the shared query builder, which is what
makes the relation lookup exact. The PayKeeper webhook branch calls it as the
first statement of its `try` and then uses the returned `orderid` for the filter
value and the existing not-found message.

### Phase 2: Behaviour specification

- [x] Started: 2026-09-18T23:28:00Z
- [x] Completed: 2026-09-18T23:29:00Z
- [x] Automated verification: `npx nx run @sps/billing:jest:test` PASSED,
      `npx nx run @sps/billing:eslint:lint` PASSED

**Notes**: `paykeeper.spec.ts` follows the `telegram-star.spec.ts` mocking
pattern. Four scenarios: a non-uuid `orderid` and a non-string `id` are refused
with no relation lookup; a canonical unknown uuid reaches the lookup with an
`eq` filter and keeps the not-found answer; a canonical known uuid completes the
existing flow through a stubbed PayKeeper invoice fetch, the invoice update, and
the callback.

## Incident Log

> Read this section FIRST before starting any implementation work.
> Parallel agents: check here for known pitfalls before debugging independently.

<!-- incident-count: 1 -->

### Incident 1 — PayKeeper signature scheme absent, so scope narrowed

- **Occurrences**: 1
- **Stage**: Phase 1 - Identifier guard in the service layer
- **Symptom**: The task direction made signature verification conditional on the
  secret-seed scheme already existing in the code, pointing at the answer hash
  `OK <md5(id + secret_seed)>`.
- **Root Cause**: No such scheme exists. A repository-wide search for `md5`,
  `createHash`, and `secret_seed` finds only the 0xprocessing signature check
  (`service/singlepage/index.ts:667`); `PAYKEEPER_WEBHOOK_SECRET` is read
  nowhere, the `key` payload field is never used, and the webhook controller
  answers `c.json({ data: result }, 200)` for every provider.
- **Fix**: Implemented identifier validation only and recorded the signature and
  answer-format gap as follow-up 1 in the plan.
- **Reusable Pattern**: Before implementing a provider signature check, confirm
  both halves of the provider's scheme (the incoming digest and the expected
  answer) exist in code or in the provider's account settings; guessing either
  silently rejects genuine callbacks.

## Summary

### Changes Made

- `libs/modules/billing/models/payment-intent/backend/app/api/src/lib/service/singlepage/webhook-identifiers.ts`
  (new): `validateWebhookIdentifiers` with `IValidateWebhookIdentifiersProps`;
  required canonical-uuid fields, optional string fields, and
  `Validation error.` messages that never carry a received value.
- `libs/modules/billing/models/payment-intent/backend/app/api/src/lib/service/singlepage/paykeeper.ts`:
  the webhook branch validates `orderid` as a uuid and `id`, `sum`, `clientid`
  as strings before the relation lookup, and uses the validated `orderid` for
  the filter and the not-found message.
- `libs/modules/billing/models/payment-intent/backend/app/api/src/lib/service/singlepage/paykeeper.spec.ts`
  (new): four BDD scenarios covering the new boundary and the unchanged paths.
- `thoughts/shared/plans/singlepagestartup/ISSUE-230.md` (new): the plan, with
  four follow-ups (signature verification, the other provider branches, webhook
  log hygiene, the unexplained `undefined` diagnosis).

All of the above are one commit on `claude/issue-230-paykeeper-validation`:
`fix(billing): validate PayKeeper webhook identifiers before the relation lookup`.

### Not Implemented

Signature verification. PayKeeper's `key` digest and the answer it expects are
both built from a secret seed that exists nowhere in this repository, so the
gap is follow-up 1 in the plan rather than a guess in code.

### Verification Commands

- `npx nx run @sps/billing:jest:test` — PASSED, 16 tests in 5 suites
- `npx nx run @sps/billing:eslint:lint` — PASSED
- `npx nx run @sps/billing:tsc:build` — PASSED

### Manual Verification

Against a running API of this worktree on `http://localhost:4015`, with the
RBAC secret read from `apps/api/.env`:

```bash
RBAC_SECRET_KEY="$(grep '^RBAC_SECRET_KEY=' apps/api/.env | cut -d= -f2-)"

# 400 Validation error. Invalid orderid
curl -i -X POST http://localhost:4015/api/billing/payment-intents/paykeeper/webhook \
  -H "X-RBAC-SECRET-KEY: $RBAC_SECRET_KEY" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data 'id=301&sum=100.00&clientid=&orderid=not-a-uuid&key=abc'

# 404 Not Found error. Payment intent to invoice relation not found ...
curl -i -X POST http://localhost:4015/api/billing/payment-intents/paykeeper/webhook \
  -H "X-RBAC-SECRET-KEY: $RBAC_SECRET_KEY" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data 'id=301&sum=100.00&clientid=&orderid=3f2b9c18-6f6f-4a1e-9f9a-2f1b8c7d4e55&key=abc'
```

The answer body is the shared exception shape
`{ requestId, path, method, status, error, stack, cause }`; `error` carries the
message and no received value.

### Pull Request

- [ ] PR created: not in this session (the lead publishes)
- [ ] PR number: —

### Final Status

- [x] All phases completed
- [x] All automated verification passed
- [ ] Issue marked as Done

---

**Last updated**: 2026-09-18T23:29:49Z
