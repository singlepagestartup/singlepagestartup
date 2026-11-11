Closes #347.

## Summary

The order checkout endpoint used the order IDs supplied by the client when annotating orders and starting payment. Someone with a valid token for their own Subject could put another customer's order ID in the body. On current main, both checkout routes already require the access token of the Subject in the URL. This PR also checks ownership of the requested orders and updates the Telegram checkout button to send the shopper's access token.

## Changes

- Order checkout looks up `SubjectsToEcommerceModuleOrders` by Subject ID and the requested order IDs together. A mixed request checks out the buyer's orders. A request containing only missing or foreign orders returns 404 before recording the receipt email or updating a comment. A malformed order ID returns 400.
- The checkout handler updates only the comment when the buyer supplies one. It sends only the selected orders to the payment service.
- The Telegram agent signs a token for the user who pressed the checkout button. Both HTTP routes require the Subject JWT even if a caller sends the operator header. Subscription renewal calls the product checkout service in-process.
- The combined controller tests cover the checkout routes and preserve the OpenRouter catalog ownership checks from #346.

## Verification

- Passed 81 targeted RBAC tests and two Agent tests. The API TypeScript check passed.
- Exercised both routes over HTTP with two temporary buyers, PostgreSQL, Redis and the dummy payment provider. Both rejected a missing token and an operator header alone with 400, and another buyer's access token with 401. Checking out an exclusively foreign order returned 404. A mixed cart produced a dummy invoice for the buyer and preserved the foreign order's status and comment. Direct product checkout returned an invoice.
- In Chromium, added Pro to the cart, selected the dummy provider, submitted a receipt email and opened the payment URL returned by checkout. External payment processors and a live Telegram bot were outside this run.

## Downstream migration

Projects with custom HTTP callers for either checkout route must send an access token for the Subject in the URL. If a project overrides cart creation or checkout, persist the Subject-to-order relation and keep the ownership filter before storing the receipt email, updating comments or starting payment. Verify successful owner checkout, an exclusively foreign order and a mixed cart with two customers.
