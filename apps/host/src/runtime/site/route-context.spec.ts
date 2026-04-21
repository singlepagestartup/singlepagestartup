/**
 * BDD Suite: host site route context resolution.
 *
 * Given: catch-all host route params may include locale prefixes and admin paths.
 * When: route context is resolved for the app-local runtime.
 * Then: language, normalized URL, and admin detection remain stable.
 */

import { resolveRouteContext } from "./route-context";

describe("resolveRouteContext", () => {
  it("keeps default language and root URL for empty params", () => {
    expect(resolveRouteContext({})).toEqual({
      url: "/",
      language: "en",
      isAdminRoute: false,
    });
  });

  it("strips the locale prefix from content routes", () => {
    expect(resolveRouteContext({ url: ["en", "blog", "post"] })).toEqual({
      url: "/blog/post",
      language: "en",
      isAdminRoute: false,
    });
  });

  it("marks admin URLs after locale normalization", () => {
    expect(resolveRouteContext({ url: ["en", "admin", "pages"] })).toEqual({
      url: "/admin/pages",
      language: "en",
      isAdminRoute: true,
    });
  });
});
