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
   * BDD Scenario: public module reads are allowed, dump and unknown reads
   *               are not.
   *
   * Given: the composed allow-list matcher with the anchored read rules.
   * When: the four public read shapes and the dump path are tested for each of
   *       host, website-builder and file-storage.
   * Then: find, count, find-by-id and the three page reads are allowed and the
   *       dump path is not.
   */
  it("allows the public module reads without opening their dump route", () => {
    const uuid = "3f2504e0-4f89-11d3-9a0c-0305e82c3301";

    for (const module of ["host", "website-builder", "file-storage"]) {
      expect(matcher.matches(`/api/${module}/widgets`, "GET")).toBe(true);
      expect(matcher.matches(`/api/${module}/widgets/`, "GET")).toBe(true);
      expect(matcher.matches(`/api/${module}/widgets/count`, "GET")).toBe(true);
      expect(matcher.matches(`/api/${module}/widgets/${uuid}`, "GET")).toBe(
        true,
      );
      expect(matcher.matches(`/api/${module}/widgets/dump`, "GET")).toBe(false);
    }

    expect(matcher.matches("/api/host/pages/find-by-url", "GET")).toBe(true);
    expect(matcher.matches("/api/host/pages/urls", "GET")).toBe(true);
    expect(matcher.matches("/api/host/pages/url-segment-value", "GET")).toBe(
      true,
    );
    expect(
      matcher.matches("/api/website-builder/widgets-to-sliders/dump", "GET"),
    ).toBe(false);
  });

  /**
   * BDD Scenario: an rbac or broadcast rule does not open a prefix sibling.
   *
   * Given: the composed allow-list matcher.
   * When: /api/broadcast/channels-to-messages/dump and
   *       /api/rbac/subjects-to-roles/dump are tested.
   * Then: both stay open to the allow-list, so the route guard is what closes
   *       them — a rule table cannot express "never anonymous".
   */
  it("still opens the prefix siblings the rbac and broadcast rules cover", () => {
    expect(
      matcher.matches("/api/broadcast/channels-to-messages/dump", "GET"),
    ).toBe(true);
    expect(matcher.matches("/api/rbac/subjects-to-roles/dump", "GET")).toBe(
      true,
    );
  });

  /**
   * BDD Scenario: the revalidation rule is gone.
   *
   * Given: the composed allow-list matcher.
   * When: the path the removed rule named is tested.
   * Then: it is not allowed, because no route serves it.
   */
  it("does not allow the revalidation path no route serves", () => {
    expect(matcher.matches("/api/revalidation/revalidate", "GET")).toBe(false);
  });

  /**
   * BDD Scenario: the allow-list no longer claims to govern the clear route.
   *
   * Given: the composed allow-list matcher.
   * When: /api/http-cache/clear is tested for GET.
   * Then: it is not allowed — and that answer decides nothing, because the
   *       route is registered before this middleware and carries its own
   *       guard (issue #277). The rule was removed so the table stops
   *       claiming an authority it never had here.
   */
  it("does not allow the cache-clear route the rule table cannot reach", () => {
    expect(matcher.matches("/api/http-cache/clear", "GET")).toBe(false);
  });

  /**
   * BDD Scenario: the agent cron trigger reaches its own route guard.
   *
   * Given: the composed allow-list matcher.
   * When: the cron path, its other methods and its neighbours are tested.
   * Then: only POST on the exact cron path is allowed, because the agent
   *       controller guards that route itself; every other agent route still
   *       goes through authorization.
   */
  it("allows only the guarded agent cron trigger", () => {
    expect(matcher.matches("/api/agent/agents/cron", "POST")).toBe(true);
    expect(matcher.matches("/api/agent/agents/cron", "GET")).toBe(false);
    expect(matcher.matches("/api/agent/agents/cron/extra", "POST")).toBe(false);
    expect(matcher.matches("/api/agent/agents", "POST")).toBe(false);
    expect(matcher.matches("/api/agent/agents/dummy", "POST")).toBe(false);
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
