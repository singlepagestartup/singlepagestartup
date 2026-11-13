Closes #352.

## Summary

A caller with a valid Subject token could previously name someone else's order in their own URL. Current main already protects all four per-order endpoints. This PR adds regression coverage for that protection and documents the credential these endpoints require.

## Changes

- Exercise the registered quantity, total, update and delete routes with an owner's JWT, another Subject's JWT, an operator header alone and no credentials. The tests also check that collection routes do not run a per-order lookup.
- Check that the ownership middleware passes both URL IDs to the Subject service and propagates a denied lookup. The route tests use the existing order-access service to evaluate Subject–Order links.

## Verification

- All 216 RBAC Jest suites passed (1,251 tests), including the 25 tests in the two new suites. The module dependency check reported zero violations.
- Tested two separate guest sessions through HTTP using an isolated PostgreSQL copy and Redis. On all four routes, a Subject using its own JWT and URL with the other Subject's order received 403. A token for another Subject on the owner's URL received 401. An operator header alone and a request without credentials each received 400.
- The owner added an item, read its quantity and total without a GET body, changed the quantity from 2 to 4 and deleted the order. The total doubled. A PATCH using the other cart's line returned 403. PostgreSQL confirmed that the second customer's order and quantity were preserved.
- The RBAC TypeScript check reports the same 63 diagnostics as main, with no additions or removals.

## Downstream migration

No application, schema or client migration is required. The behavior is already in main.
