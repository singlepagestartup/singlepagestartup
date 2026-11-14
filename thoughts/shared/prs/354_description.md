Closes #349.

## Summary

Customers could read other customers’ order lines through the Ecommerce relation API. The framework seed now grants Admin access to its four GET routes (list, count, by ID and line total). The Subject order widget reads its lines through the new owner route. The checkout sheet and product cart already get their lines from the Subject order list with `includeCartDetails`.

## Changes

- `GET /api/rbac/subjects/{id}/ecommerce-module/orders-to-products` requires the owner's access JWT, looks up their order IDs through `subjects-to-ecommerce-module-orders` and applies caller filters within that set. It returns each matching line with its totals per currency. A line without a price stays visible.
- The widget supplies the rows to the Ecommerce cart card. The card renders each line once and puts the order actions below the lines. The standalone reader remains available to authorized callers.
- Checkout now considers every attribute key of type `price`. Previously a product priced under a second key could show a total in the cart and fail at checkout. The selected currency still needs a single matching price.
- Permissions and Admin links ship as RBAC snapshots. The Studio inventory includes the owner reader and the three chat variants introduced on main.

## Verification

- Exercised the API after running the RBAC seed against a disposable PostgreSQL copy with separate Redis. The same owner JWT received 403 without a matching permission and 200 after the permission was added. The owner read and updated their lines. A foreign order filter returned no lines, another Subject’s JWT received 401, and an operator header alone received 400 on the owner route. On all four global reads, the Admin JWT received 200 and anonymous and customer requests received 403.
- In Chromium, a guest opened the cart on `/ru/framework` and changed a quantity from 2 to 3. The API confirmed the update. Separately over HTTP, doubling a quantity doubled its price, deleting a cart removed its lines, and dummy checkout created an invoice with a payment URL.
- All 1,532 RBAC, Ecommerce and Host tests passed across 276 suites. The module dependency check reported zero violations. RBAC TypeScript diagnostics matched the 63 already on main.

## Downstream migration

Run the standard RBAC seed so the new route permission and four Admin attachments are installed. For installations that manage their own grants, verify all four global reads with a customer token and an Admin token. Move any customer-facing calls to the global line endpoints to the Subject SDK or reuse the Subject list with `includeCartDetails`. Custom cart cards can receive the loaded lines through `ordersToProducts`. Verify that the owner can read and edit their cart and that a customer cannot read another customer's lines.
