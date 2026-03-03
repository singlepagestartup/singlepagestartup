/**
 * BDD Suite: admin-route utils.
 *
 * Given: suite fixtures and test doubles are prepared for deterministic behavior.
 * When: a scenario action from this suite is executed.
 * Then: assertions verify expected observable behavior and contracts.
 */

import { getAdminBasePath, getAdminRoutePath, parseAdminRoute } from "./index";

describe("admin-route utils", () => {
  it("extracts admin route path from full pathname", () => {
    expect(getAdminRoutePath("/admin/ecommerce/product/")).toBe(
      "/ecommerce/product",
    );
  });

  it("returns root when admin segment is not present", () => {
    expect(getAdminRoutePath("/ru/profile")).toBe("/");
  });

  it("parses module and model from admin path", () => {
    expect(parseAdminRoute("/ecommerce/product")).toEqual({
      module: "ecommerce",
      model: "product",
    });
  });

  it("parses module-only path", () => {
    expect(parseAdminRoute("/ecommerce")).toEqual({
      module: "ecommerce",
      model: null,
    });
  });

  it("ignores extra nested segments and keeps first two levels", () => {
    expect(parseAdminRoute("/social/profile/123")).toEqual({
      module: "social",
      model: "profile",
    });
  });

  it("normalizes admin base path to non-localized /admin", () => {
    expect(getAdminBasePath("/admin/ecommerce/product")).toBe("/admin");
  });

  it("falls back to /admin when segment is missing", () => {
    expect(getAdminBasePath("/ru/profile")).toBe("/admin");
  });
});
