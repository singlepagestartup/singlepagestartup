/**
 * BDD Suite: HTTP-cache excluded-routes matcher.
 *
 * Given: the composed cache-exclusion matcher (singlepage defaults + startup +
 *        options).
 * When: representative request paths are tested.
 * Then: infrastructure endpoints, auth probes, and non-describable reads are
 *       excluded; ordinary model reads are NOT — replacing the former inline
 *       substring checks with a tested, extensible route list (issue #195 DX).
 */

import { createExcludedRoutesMatcher } from "./index";

const SID = "303302a0-4eb7-4cef-af04-74d7e8e72442";
const PID = "88862025-5c38-4ce8-bb4c-4c5c511b874c";
const CID = "e3d65d9b-60fa-4e6b-8e4d-7a93960bc249";
const TID = "38529ce7-f88d-45d3-9f34-f40b6a3bf82c";

describe("http-cache excluded routes", () => {
  const matcher = createExcludedRoutesMatcher();

  /**
   * BDD Scenario: Infrastructure endpoints (former substring bypasses) are
   * excluded.
   */
  it("excludes infrastructure and auth-probe endpoints", () => {
    expect(matcher.matches("/api/revalidation/revalidate")).toBe(true);
    expect(matcher.matches("/api/http-cache/clear")).toBe(true);
    expect(matcher.matches("/api/broadcast/channels")).toBe(true);
    expect(matcher.matches("/favicon.ico")).toBe(true);
    expect(matcher.matches("/api/rbac/subjects/authentication/me")).toBe(true);
    expect(matcher.matches("/api/rbac/subjects/authentication/init")).toBe(
      true,
    );
    expect(
      matcher.matches("/api/rbac/subjects/authentication/is-authorized"),
    ).toBe(true);
  });

  /**
   * BDD Scenario: Non-describable reads (issue-152/195) are excluded.
   */
  it("excludes cart counters and chat realtime reads", () => {
    expect(
      matcher.matches(
        `/api/rbac/subjects/${SID}/ecommerce-module/orders/quantity`,
      ),
    ).toBe(true);
    expect(
      matcher.matches(
        `/api/rbac/subjects/${SID}/ecommerce-module/orders/total`,
      ),
    ).toBe(true);
    expect(
      matcher.matches(
        `/api/rbac/subjects/${SID}/social-module/profiles/${PID}/chats/${CID}/threads/${TID}/messages`,
      ),
    ).toBe(true);
    expect(
      matcher.matches(
        `/api/rbac/subjects/${SID}/social-module/profiles/${PID}/chats/${CID}/actions`,
      ),
    ).toBe(true);
  });

  /**
   * BDD Scenario: Ordinary model reads are cached (NOT excluded).
   */
  it("does not exclude ordinary model reads", () => {
    expect(matcher.matches("/api/ecommerce/orders")).toBe(false);
    expect(
      matcher.matches(`/api/rbac/subjects/${SID}/ecommerce-module/orders`),
    ).toBe(false);
    expect(matcher.matches("/api/social/messages")).toBe(false);
  });

  /**
   * BDD Scenario: Constructor option routes extend the defaults.
   */
  it("honors project/option route extensions", () => {
    const extended = createExcludedRoutesMatcher([
      { regexPath: /^\/api\/crm\/boards\/[0-9a-f-]+\/burndown$/i },
    ]);

    expect(extended.matches(`/api/crm/boards/${CID}/burndown`)).toBe(true);
    expect(extended.matches("/api/ecommerce/orders")).toBe(false);
  });
});
