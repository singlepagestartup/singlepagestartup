import { getAdminBasePath, getAdminRoutePath, parseAdminRoute } from "./index";

describe("admin-route utils", () => {
  it("extracts admin route path from full pathname", () => {
    expect(
      getAdminRoutePath("/ru/admin/modules/ecommerce/models/product/"),
    ).toBe("/modules/ecommerce/models/product");
  });

  it("returns root when admin segment is not present", () => {
    expect(getAdminRoutePath("/ru/profile")).toBe("/");
  });

  it("parses module and model from admin path", () => {
    expect(parseAdminRoute("/modules/ecommerce/models/product")).toEqual({
      module: "ecommerce",
      model: "product",
    });
  });

  it("parses module-only path", () => {
    expect(parseAdminRoute("/modules/ecommerce")).toEqual({
      module: "ecommerce",
      model: null,
    });
  });

  it("returns null values for unsupported path format", () => {
    expect(parseAdminRoute("/modules/ecommerce/relations/products")).toEqual({
      module: null,
      model: null,
    });
  });

  it("resolves admin base path with locale prefix", () => {
    expect(getAdminBasePath("/ru/admin/modules/ecommerce/models/product")).toBe(
      "/ru/admin",
    );
  });

  it("falls back to /admin when segment is missing", () => {
    expect(getAdminBasePath("/ru/profile")).toBe("/admin");
  });
});
