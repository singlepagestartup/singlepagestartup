/**
 * BDD Suite: public sitemap HTTP contract.
 * Given: localized public URLs or a failed upstream page enumeration.
 * When: a crawler requests sitemap.xml.
 * Then: it receives escaped canonical URLs or a non-cacheable 503 on failure.
 */
import { GET } from "./route";
import { api } from "@sps/host/models/page/sdk/server";

jest.mock("@sps/host/models/page/sdk/server", () => ({
  api: { urls: jest.fn() },
}));
jest.mock("@sps/shared-configuration", () => ({
  internationalization: {
    languages: [{ code: "en" }, { code: "ru" }],
    defaultLanguage: { code: "en" },
  },
}));
jest.mock("@sps/shared-utils", () => ({
  ...jest.requireActual("@sps/shared-utils"),
  NEXT_PUBLIC_HOST_SERVICE_URL: "https://example.test/",
}));

const urls = api.urls as jest.Mock;

it("publishes each saved language once and escapes XML characters in paths", async () => {
  urls.mockResolvedValue([
    { url: [], language: "ru" },
    { url: ["blog", "one&two"], language: "ru" },
    { url: ["blog", "one&two"], language: "ru" },
    { url: ["about"], language: "en" },
    { url: ["admin"], language: "en" },
    { url: ["about"], language: "xx" },
  ]);
  const response = await GET(new Request("https://example.test/sitemap.xml"));
  const body = await response.text();
  expect(response.status).toBe(200);
  expect(body).toContain('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"');
  expect(body).toContain("<loc>https://example.test/ru</loc>");
  expect(body).toContain("<loc>https://example.test/ru/blog/one&amp;two</loc>");
  expect(body).toContain("<loc>https://example.test/en/about</loc>");
  expect(body.match(/<loc>/g)).toHaveLength(3);
  expect(body).not.toMatch(/admin|hreflang|lastmod/);
});

it("returns a successful empty sitemap only for a successful empty enumeration", async () => {
  urls.mockResolvedValue([]);
  const response = await GET(new Request("https://example.test/sitemap.xml"));
  expect(response.status).toBe(200);
  expect(await response.text()).not.toContain("<loc>");
});

it.each([undefined, new Error("API unavailable")])(
  "does not cache a missing or failed enumeration",
  async (result) => {
    if (result instanceof Error) urls.mockRejectedValue(result);
    else urls.mockResolvedValue(result);
    const response = await GET(new Request("https://example.test/sitemap.xml"));
    expect(response.status).toBe(503);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("retry-after")).toBe("60");
  },
);

it("splits a large sitemap into discoverable protocol-compliant parts", async () => {
  urls.mockResolvedValue(
    Array.from({ length: 50_001 }, (_, index) => ({
      url: ["article", String(index)],
      language: "ru",
    })),
  );
  const index = await GET(new Request("https://example.test/sitemap.xml"));
  expect(index.status).toBe(200);
  expect(await index.text()).toContain("sitemap.xml?part=2");
  const first = await GET(
    new Request("https://example.test/sitemap.xml?part=1"),
  );
  expect((await first.text()).match(/<url>/g)).toHaveLength(50_000);
  const second = await GET(
    new Request("https://example.test/sitemap.xml?part=2"),
  );
  expect((await second.text()).match(/<url>/g)).toHaveLength(1);
  expect(
    (await GET(new Request("https://example.test/sitemap.xml?part=3"))).status,
  ).toBe(404);
});
