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
  const uuid = "3f2504e0-4f89-11d3-9a0c-0305e82c3301";

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
    expect(matcher.matches("/api/broadcast/channels", "GET")).toBe(true);
  });

  /**
   * BDD Scenario: Method constraints are honored.
   */
  it("does not allow a public-GET endpoint for a mutating method", () => {
    expect(matcher.matches("/api/host/pages", "POST")).toBe(false);
    expect(matcher.matches("/api/broadcast/channels", "POST")).toBe(false);
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
   * BDD Scenario: a public module read embedded in another path.
   *
   * Given: the composed allow-list matcher with the module read rules
   *        anchored at both ends.
   * When: paths that end like a public read but start under another module
   *       are tested.
   * Then: none is allowed, so the read rules open only the reads they name.
   */
  it("does not allow a public module read embedded in another path", () => {
    expect(matcher.matches("/api/ecommerce/orders/api/host/pages", "GET")).toBe(
      false,
    );
    expect(
      matcher.matches("/api/agent/agents/api/host/pages/count", "GET"),
    ).toBe(false);
    expect(
      matcher.matches(`/api/rbac/subjects/api/host/pages/${uuid}`, "GET"),
    ).toBe(false);
    expect(
      matcher.matches("/api/social/profiles/api/host/pages/urls", "GET"),
    ).toBe(false);
  });

  /**
   * BDD Scenario: the favicon rule opens the favicon only.
   *
   * Given: the composed allow-list matcher.
   * When: the favicon path, a protected route ending in favicon.ico and a
   *       look-alike file name are tested.
   * Then: only GET /favicon.ico is allowed.
   */
  it("allows the favicon without opening paths that end in it", () => {
    expect(matcher.matches("/favicon.ico", "GET")).toBe(true);
    expect(matcher.matches("/api/agent/agents/favicon.ico", "GET")).toBe(false);
    expect(matcher.matches("/favicon.ico/extra", "GET")).toBe(false);
    expect(matcher.matches("/faviconxico", "GET")).toBe(false);
  });

  /**
   * BDD Scenario: the broadcast rule opens the channel list only.
   *
   * Given: the composed allow-list matcher.
   * When: the channel list, which the observer reads without a credential,
   *       and every other read the former prefix rule admitted are tested.
   * Then: only the channel list is allowed; the channel count, a channel by
   *       id, its messages and the channels-to-messages relation go to the
   *       permission service.
   */
  it("allows the channel list and nothing else under broadcast", () => {
    expect(matcher.matches("/api/broadcast/channels", "GET")).toBe(true);

    expect(matcher.matches("/api/broadcast/channels/", "GET")).toBe(false);
    expect(matcher.matches("/api/broadcast/channels/count", "GET")).toBe(false);
    expect(matcher.matches(`/api/broadcast/channels/${uuid}`, "GET")).toBe(
      false,
    );
    expect(
      matcher.matches(`/api/broadcast/channels/${uuid}/messages`, "GET"),
    ).toBe(false);
    expect(matcher.matches("/api/broadcast/channels-to-messages", "GET")).toBe(
      false,
    );
    expect(
      matcher.matches(`/api/broadcast/channels-to-messages/${uuid}`, "GET"),
    ).toBe(false);
    expect(
      matcher.matches("/api/broadcast/channels-to-messages/dump", "GET"),
    ).toBe(false);
  });

  /**
   * BDD Scenario: each authentication route is allowed for its own method.
   *
   * Given: the composed allow-list matcher.
   * When: every route the subject controller registers under
   *       /api/rbac/subjects/authentication/ is tested with its method.
   * Then: all fourteen are allowed, so a caller without a session can still
   *       start one, renew it, end it and be checked by the middlewares.
   */
  it("allows every authentication route for its own method", () => {
    const routes: Array<[string, string]> = [
      ["GET", "is-authorized"],
      ["GET", "me"],
      ["GET", "init"],
      ["POST", "bill-route"],
      ["POST", "refresh"],
      ["POST", "logout"],
      ["POST", "ethereum-virtual-machine"],
      ["POST", "email-and-password/registration"],
      ["POST", "email-and-password/authentication"],
      ["POST", "email-and-password/forgot-password"],
      ["POST", "email-and-password/reset-password"],
      ["POST", "oauth/exchange"],
      ["POST", "oauth/google"],
      ["GET", "oauth/google/callback"],
    ];

    for (const [method, route] of routes) {
      expect(
        matcher.matches(`/api/rbac/subjects/authentication/${route}`, method),
      ).toBe(true);
    }
  });

  /**
   * BDD Scenario: the authentication rules open no other path or method.
   *
   * Given: the composed allow-list matcher.
   * When: paths and methods the former authentication rules admitted beyond
   *       the registered routes are tested: the other method of a route, a
   *       name that starts like a route, a sub-path, an unknown POST path and
   *       a path that embeds the prefix.
   * Then: none is allowed.
   */
  it("does not allow other methods or paths under the authentication prefix", () => {
    const prefix = "/api/rbac/subjects/authentication";

    expect(matcher.matches(`${prefix}/me`, "POST")).toBe(false);
    expect(matcher.matches(`${prefix}/init`, "POST")).toBe(false);
    expect(matcher.matches(`${prefix}/is-authorized`, "POST")).toBe(false);
    expect(matcher.matches(`${prefix}/refresh`, "GET")).toBe(false);
    expect(matcher.matches(`${prefix}/bill-route`, "GET")).toBe(false);
    expect(matcher.matches(`${prefix}/oauth/google`, "GET")).toBe(false);
    expect(matcher.matches(`${prefix}/oauth/google/callback`, "POST")).toBe(
      false,
    );

    expect(matcher.matches(`${prefix}/meanwhile`, "GET")).toBe(false);
    expect(matcher.matches(`${prefix}/me/extra`, "GET")).toBe(false);
    expect(matcher.matches(`${prefix}/init/`, "GET")).toBe(false);
    expect(
      matcher.matches(`${prefix}/oauth/google/callback/extra`, "GET"),
    ).toBe(false);

    expect(matcher.matches(`${prefix}/unknown`, "POST")).toBe(false);
    expect(matcher.matches(`${prefix}/`, "POST")).toBe(false);
    expect(matcher.matches(`${prefix}/email-and-password`, "POST")).toBe(false);

    expect(matcher.matches(`/api/ecommerce/orders${prefix}/me`, "GET")).toBe(
      false,
    );
  });

  /**
   * BDD Scenario: the permission graph is decided by the permission service.
   *
   * Given: the composed allow-list matcher.
   * When: the reads of permissions, roles-to-permissions and subjects-to-roles
   *       that the former rules admitted are tested.
   * Then: none is allowed, so the permission rows decide them like every
   *       other route.
   */
  it("does not allow the permission graph reads", () => {
    for (const path of [
      "/api/rbac/permissions",
      "/api/rbac/permissions/count",
      `/api/rbac/permissions/${uuid}`,
      "/api/rbac/permissions/find-by-route",
      "/api/rbac/permissions/resolve-by-route",
      "/api/rbac/roles-to-permissions",
      "/api/rbac/roles-to-permissions/count",
      `/api/rbac/roles-to-permissions/${uuid}`,
      "/api/rbac/subjects-to-roles",
      "/api/rbac/subjects-to-roles/count",
      `/api/rbac/subjects-to-roles/${uuid}`,
      "/api/rbac/subjects-to-roles/dump",
    ]) {
      expect(matcher.matches(path, "GET")).toBe(false);
    }
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

  /**
   * BDD Scenario: a project reopens a route the framework list closed.
   *
   * Given: a project rule that names one route the framework rules no longer
   *        allow.
   * When: that route and its neighbours are tested.
   * Then: only the named route is allowed, so a project that needs an
   *       anonymous read declares it without widening the framework list.
   */
  it("lets a project reopen a closed route through its own rule", () => {
    const extended = createAllowedRoutesMatcher([
      { regexPath: /^\/api\/rbac\/roles-to-permissions$/, methods: ["GET"] },
    ]);

    expect(extended.matches("/api/rbac/roles-to-permissions", "GET")).toBe(
      true,
    );
    expect(
      extended.matches(`/api/rbac/roles-to-permissions/${uuid}`, "GET"),
    ).toBe(false);
    expect(extended.matches("/api/rbac/subjects-to-roles", "GET")).toBe(false);
  });
});
