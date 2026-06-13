/**
 * BDD Suite: is-authorized allowed-routes matcher.
 *
 * Given: the composed allow-list matcher (singlepage + startup + options).
 * When: representative auth-free and protected paths are tested.
 * Then: public framework endpoints are allowed (method-aware); protected model
 *       routes are not — the route list is now a tested, extensible unit.
 */

import { createAllowedRoutesMatcher } from "./index";

describe("is-authorized allowed routes", () => {
  const matcher = createAllowedRoutesMatcher();

  /**
   * BDD Scenario: Public framework endpoints are allowed for their methods.
   */
  it("allows public framework endpoints", () => {
    expect(matcher.matches("/favicon.ico", "GET")).toBe(true);
    expect(matcher.matches("/api/rbac/subjects/authentication/me", "GET")).toBe(
      true,
    );
    expect(
      matcher.matches(
        "/api/rbac/subjects/authentication/email-and-password/authentication",
        "POST",
      ),
    ).toBe(true);
    expect(matcher.matches("/api/host/page", "GET")).toBe(true);
    expect(matcher.matches("/api/rbac/permissions", "GET")).toBe(true);
  });

  /**
   * BDD Scenario: Method constraints are honored.
   */
  it("does not allow a public-GET endpoint for a mutating method", () => {
    expect(matcher.matches("/api/rbac/permissions", "POST")).toBe(false);
  });

  /**
   * BDD Scenario: Protected model routes require auth.
   */
  it("does not allow protected model routes", () => {
    expect(matcher.matches("/api/ecommerce/orders", "GET")).toBe(false);
    expect(matcher.matches("/api/social/messages", "POST")).toBe(false);
  });

  /**
   * BDD Scenario: Project/option extensions are honored.
   */
  it("honors project/option allowed-route extensions", () => {
    const extended = createAllowedRoutesMatcher([
      { regexPath: /\/api\/crm\/public-webhooks\/.*/, methods: ["POST"] },
    ]);

    expect(extended.matches("/api/crm/public-webhooks/stripe", "POST")).toBe(
      true,
    );
    expect(extended.matches("/api/crm/public-webhooks/stripe", "GET")).toBe(
      false,
    );
  });
});
