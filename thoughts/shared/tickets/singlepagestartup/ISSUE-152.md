# Issue: RBAC/Ecommerce Cart tests: unit+integration coverage for product and cart interactions

## Metadata

**URL**: https://github.com/singlepagestartup/singlepagestartup/issues/152
**Issue**: #152
**Status**: Research Needed
**Created**: 2026-04-05
**Priority**: high
**Size**: large
**Type**: refactoring

---

## Problem to Solve

Cart/product interactions are composed across `host`, `ecommerce`, and `rbac` layers, but the critical component behavior and backend communication paths currently do not have dedicated unit and integration coverage in the target branches. We need deterministic tests for user actions: add to cart, update quantity, remove from cart, open cart and badge behavior, and checkout from product/cart contexts.

## Key Details

- Product page card rendering occurs through host/ecommerce composition, while actionable cart logic is orchestrated at RBAC subject variants.
- Architectural constraint: `rbac` is above `ecommerce`; reverse imports from `ecommerce` to `rbac` are not allowed.
- Scope must include authorized and unauthorized behavior.
- Scope excludes routing/page switching checks and focuses on component behavior, API interaction, and edge cases.
- Existing broad E2E initiatives were closed; this issue is a focused cart/product testing stream.

## Implementation Notes

- Add unit tests for RBAC ecommerce product cart decision tree and submit actions:
  - `ecommerce-module-product-cart-default` branch behavior (create vs update/delete/checkout)
  - `order/create-default`, `order/update-default`, `order/delete-default`, `order/checkout-default`
  - auth gating/fallback rendering via `authentication-me-default`
- Add frontend integration tests for cross-layer wiring:
  - host product variants `default` and `overview-default` passing control to RBAC variants
  - cart trigger/sheet and quantity badge behavior in `me-ecommerce-module-cart-default`
  - lifecycle of component actions without route transitions: add -> cart state refresh -> update/delete -> checkout trigger
- Add integration coverage for backend behavior invoked by frontend user actions (request/response contracts, mutations, and side effects relevant to cart/order lifecycle).
- Add boundary-condition coverage for both frontend and backend paths (empty cart, missing auth subject, invalid payloads, duplicate actions, unavailable provider, and error responses).
- Update documentation to explicitly state layering boundary `rbac > ecommerce` and import constraints.
- No public API/schema changes are expected.
