/**
 * BDD Suite: SEO URL and indexing policy.
 * Given: public content paths, application routes and script data.
 * When: SEO helpers resolve URLs and classify Page masks.
 * Then: canonical URLs retain the locale, private masks are excluded and JSON is safe in HTML.
 */
import {
  getSeoCanonicalUrl,
  isSeoIndexablePage,
  resolveSeoRoute,
  safeJsonLd,
} from "./seo";

describe("SEO URL policy", () => {
  it("extracts a configured locale without including tracking query or hash", () => {
    expect(
      resolveSeoRoute(
        "/ru/blog/article?utm_source=ad#section",
        ["en", "ru"],
        "en",
      ),
    ).toEqual({ pathname: "/blog/article", language: "ru" });
    expect(resolveSeoRoute("/blog/2", ["en", "ru"], "en")).toEqual({
      pathname: "/blog/2",
      language: "en",
    });
  });
  it.each([
    ["/", "https://example.test/ru"],
    ["/blog/2?utm_source=ad", "https://example.test/ru/blog/2"],
    ["/ru/blog/2/", "https://example.test/ru/ru/blog/2"],
    ["/ru", "https://example.test/ru/ru"],
    ["/статья", "https://example.test/ru/%D1%81%D1%82%D0%B0%D1%82%D1%8C%D1%8F"],
  ])("normalizes %s to its localized canonical URL", (pathname, expected) => {
    expect(
      getSeoCanonicalUrl({
        origin: "https://example.test/",
        pathname,
        language: "ru",
      }),
    ).toBe(expected);
  });
  it("rejects a credential-bearing or non-HTTP origin", () => {
    for (const origin of [
      "https://secret@example.test",
      "javascript:alert(1)",
    ]) {
      expect(() =>
        getSeoCanonicalUrl({ origin, pathname: "/", language: "ru" }),
      ).toThrow();
    }
  });
  it.each(["default", "custom-landing"])(
    "indexes published Page variant %s",
    (variant) => {
      expect(isSeoIndexablePage({ variant })).toBe(true);
    },
  );
  it.each(["hidden", "draft", "noindex"])(
    "excludes Page variant %s",
    (variant) => {
      expect(isSeoIndexablePage({ variant })).toBe(false);
    },
  );
  it("keeps structured data parseable without an HTML script closing tag", () => {
    const value = { name: '</script><script>alert("x")</script>&\u2028' };
    const json = safeJsonLd(value);
    expect(json).not.toMatch(/[<>&\u2028]/);
    expect(JSON.parse(json)).toEqual(value);
  });
});
