/**
 * BDD Suite: admin-route utils.
 *
 * Given: suite fixtures and test doubles are prepared for deterministic behavior.
 * When: a scenario action from this suite is executed.
 * Then: assertions verify expected observable behavior and contracts.
 */

import {
  getAdminBasePath,
  getAdminRoutePath,
  isAdminRoute,
  isAdminModelRoute,
  parseAdminRoute,
} from "./index";

describe("admin-route utils", () => {
  /**
   * BDD Scenario: extracts the normalized admin route path.
   *
   * Given: a pathname that includes the admin shell prefix.
   * When: the route path is normalized.
   * Then: only the in-admin path remains without a trailing slash.
   */
  it("extracts admin route path from full pathname", () => {
    expect(getAdminRoutePath("/admin/ecommerce/product/")).toBe(
      "/ecommerce/product",
    );
  });

  /**
   * BDD Scenario: falls back to the root path outside admin routes.
   *
   * Given: a pathname without the admin segment.
   * When: the route path is normalized.
   * Then: the helper returns the root sentinel path.
   */
  it("returns root when admin segment is not present", () => {
    expect(getAdminRoutePath("/ru/profile")).toBe("/");
  });

  /**
   * BDD Scenario: parses module and model segments.
   *
   * Given: an admin path with module and model segments.
   * When: the path is parsed.
   * Then: the first two segments are returned as module and model.
   */
  it("parses module and model from admin path", () => {
    expect(parseAdminRoute("/ecommerce/product")).toEqual({
      module: "ecommerce",
      model: "product",
    });
  });

  /**
   * BDD Scenario: parses module-only paths.
   *
   * Given: an admin path that points only to a module root.
   * When: the path is parsed.
   * Then: the module is preserved and model remains null.
   */
  it("parses module-only path", () => {
    expect(parseAdminRoute("/ecommerce")).toEqual({
      module: "ecommerce",
      model: null,
    });
  });

  /**
   * BDD Scenario: keeps only the first two route levels.
   *
   * Given: an admin path with deeper nested segments.
   * When: the path is parsed.
   * Then: nested segments do not replace the module or model identity.
   */
  it("ignores extra nested segments and keeps first two levels", () => {
    expect(parseAdminRoute("/social/profile/123")).toEqual({
      module: "social",
      model: "profile",
    });
  });

  /**
   * BDD Scenario: matches any route inside a module when only module is provided.
   *
   * Given: an admin route inside a module and no model constraint.
   * When: route matching is evaluated.
   * Then: the matcher returns true for the module root and its nested model routes.
   */
  it("matches module routes when only the module is provided", () => {
    expect(isAdminRoute("/admin/ecommerce", "ecommerce")).toBe(true);
    expect(isAdminRoute("/admin/ecommerce/product", "ecommerce")).toBe(true);
    expect(isAdminRoute("/admin/social/profile", "ecommerce")).toBe(false);
  });

  /**
   * BDD Scenario: matches exact model routes for sibling slugs.
   *
   * Given: sibling model slugs where one slug prefixes another.
   * When: exact model route matching is evaluated.
   * Then: only the exact module and model combination is considered active.
   */
  it("matches exact model routes for overlapping website-builder slugs", () => {
    expect(
      isAdminRoute(
        "/admin/website-builder/button",
        "website-builder",
        "button",
      ),
    ).toBe(true);
    expect(
      isAdminRoute(
        "/admin/website-builder/buttons-array",
        "website-builder",
        "button",
      ),
    ).toBe(false);
    expect(
      isAdminRoute(
        "/admin/website-builder/buttons-array",
        "website-builder",
        "buttons-array",
      ),
    ).toBe(true);
  });

  /**
   * BDD Scenario: rejects prefixed siblings in other modules.
   *
   * Given: another module with overlapping model slugs.
   * When: exact model route matching is evaluated.
   * Then: the shorter slug does not capture the longer sibling route.
   */
  it("matches exact model routes for overlapping ecommerce slugs", () => {
    expect(
      isAdminRoute("/admin/ecommerce/attribute", "ecommerce", "attribute"),
    ).toBe(true);
    expect(
      isAdminRoute("/admin/ecommerce/attribute-key", "ecommerce", "attribute"),
    ).toBe(false);
    expect(
      isAdminRoute(
        "/admin/ecommerce/attribute-key",
        "ecommerce",
        "attribute-key",
      ),
    ).toBe(true);
  });

  /**
   * BDD Scenario: preserves identity for nested model routes.
   *
   * Given: a deeper nested route under a model.
   * When: exact model route matching is evaluated.
   * Then: deeper segments still map back to the original module and model.
   */
  it("matches nested routes using the first two admin segments", () => {
    expect(
      isAdminRoute(
        "/admin/social/attribute-key/123/edit",
        "social",
        "attribute-key",
      ),
    ).toBe(true);
    expect(
      isAdminRoute(
        "/admin/social/attribute-key/123/edit",
        "social",
        "attribute",
      ),
    ).toBe(false);
  });

  /**
   * BDD Scenario: preserves the model-specific helper as a thin wrapper.
   *
   * Given: callers still use the existing exact-model helper.
   * When: the helper is evaluated.
   * Then: it behaves identically to the shared route matcher with a model argument.
   */
  it("keeps isAdminModelRoute aligned with the shared matcher", () => {
    expect(
      isAdminModelRoute(
        "/admin/social/attribute-key",
        "social",
        "attribute-key",
      ),
    ).toBe(
      isAdminRoute("/admin/social/attribute-key", "social", "attribute-key"),
    );
  });

  /**
   * BDD Scenario: normalizes the admin base path.
   *
   * Given: a pathname already inside the admin shell.
   * When: the admin base path is requested.
   * Then: the canonical non-localized admin prefix is returned.
   */
  it("normalizes admin base path to non-localized /admin", () => {
    expect(getAdminBasePath("/admin/ecommerce/product")).toBe("/admin");
  });

  /**
   * BDD Scenario: falls back to the canonical admin base path.
   *
   * Given: a pathname outside the admin shell.
   * When: the admin base path is requested.
   * Then: the canonical admin prefix is still returned.
   */
  it("falls back to /admin when segment is missing", () => {
    expect(getAdminBasePath("/ru/profile")).toBe("/admin");
  });
});
