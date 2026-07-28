/**
 * BDD Suite: observer skipped-routes matcher.
 *
 * Given: the composed skip matcher (singlepage + startup + options).
 * When: broadcast and ordinary paths are tested.
 * Then: broadcast endpoints are skipped (no recursive observation); ordinary
 *       mutations are observed.
 */

import { createSkippedRoutesMatcher } from "./index";

describe("observer skipped routes", () => {
  const matcher = createSkippedRoutesMatcher();

  /**
   * BDD Scenario: Broadcast endpoints are skipped.
   */
  it("skips broadcast endpoints", () => {
    expect(matcher.matches("/api/broadcast/channels")).toBe(true);
    expect(matcher.matches("/api/broadcast/messages")).toBe(true);
  });

  /**
   * BDD Scenario: Ordinary mutations are observed.
   */
  it("does not skip ordinary routes", () => {
    expect(matcher.matches("/api/ecommerce/orders")).toBe(false);
    expect(matcher.matches("/api/social/messages")).toBe(false);
  });

  /**
   * BDD Scenario: Project/option extensions are honored.
   */
  it("honors project/option skip-route extensions", () => {
    const extended = createSkippedRoutesMatcher([
      { regexPath: /\/api\/crm\/internal\/.*/ },
    ]);

    expect(extended.matches("/api/crm/internal/sync")).toBe(true);
  });
});
