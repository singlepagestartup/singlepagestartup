/**
 * BDD Suite: revalidation not-revalidating-routes matcher.
 *
 * Given: the composed skip matcher (singlepage + startup + options).
 * When: auth/internal writes and ordinary mutations are tested.
 * Then: auth/action/broadcast writes are skipped; ordinary model mutations
 *       still broadcast.
 */

import { createNotRevalidatingRoutesMatcher } from "./index";

describe("revalidation not-revalidating routes", () => {
  const matcher = createNotRevalidatingRoutesMatcher();

  /**
   * BDD Scenario: Auth/internal writes do not broadcast.
   */
  it("skips auth, action, and broadcast writes", () => {
    expect(
      matcher.matches(
        "/api/rbac/subjects/authentication/email-and-password/authentication",
        "POST",
      ),
    ).toBe(true);
    expect(matcher.matches("/api/rbac/actions", "POST")).toBe(true);
    expect(matcher.matches("/api/broadcast/messages", "POST")).toBe(true);
  });

  /**
   * BDD Scenario: Ordinary model mutations still broadcast.
   */
  it("does not skip ordinary model mutations", () => {
    expect(matcher.matches("/api/ecommerce/orders", "POST")).toBe(false);
    expect(matcher.matches("/api/social/messages", "POST")).toBe(false);
  });

  /**
   * BDD Scenario: Project/option extensions are honored.
   */
  it("honors project/option skip-route extensions", () => {
    const extended = createNotRevalidatingRoutesMatcher([
      { regexPath: /\/api\/crm\/internal-sync/, methods: ["POST"] },
    ]);

    expect(extended.matches("/api/crm/internal-sync", "POST")).toBe(true);
  });
});
