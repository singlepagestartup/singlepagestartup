/**
 * BDD Suite: fragment route context.
 *
 * Given: public host routes include a locale prefix.
 * When: the fragment runtime resolves route context for site rendering.
 * Then: the locale is kept as language and removed from the page lookup URL.
 */

import { resolveRouteContext } from "./route-context";

describe("fragment route context", () => {
  /**
   * BDD Scenario: locale-only route resolves to the homepage.
   *
   * Given: the browser opens /en.
   * When: Next passes ["en"] to the catch-all route.
   * Then: find-by-url receives / and the language remains en.
   */
  it("strips locale prefix before page lookup", () => {
    expect(resolveRouteContext({ url: ["en"] })).toEqual({
      url: "/",
      language: "en",
      isAdminRoute: false,
    });
  });

  /**
   * BDD Scenario: nested locale route preserves the page path.
   *
   * Given: the browser opens /en/products/example.
   * When: Next passes the locale-prefixed route segments.
   * Then: the page lookup URL excludes only the locale segment.
   */
  it("preserves nested path after locale prefix", () => {
    expect(resolveRouteContext({ url: ["en", "products", "example"] })).toEqual(
      {
        url: "/products/example",
        language: "en",
        isAdminRoute: false,
      },
    );
  });
});
