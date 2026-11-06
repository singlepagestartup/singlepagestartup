/**
 * BDD Suite: robots tracking directives.
 * Given: a public site with tracking and content-selection query parameters.
 * When: a crawler reads robots.txt.
 * Then: Yandex may ignore tracking fields while content selectors and noindex pages remain crawlable.
 */
import { GET } from "./route";
jest.mock("@sps/shared-utils", () => ({
  ...jest.requireActual("@sps/shared-utils"),
  NEXT_PUBLIC_HOST_SERVICE_URL: "https://example.test/",
}));

it("publishes a sitemap without preventing crawlers from reading Page noindex", async () => {
  const response = await GET();
  const body = await response.text();
  expect(response.status).toBe(200);
  expect(body).toBe(
    "User-agent: *\nAllow: /\n\nSitemap: https://example.test/sitemap.xml\n",
  );
  expect(body).not.toMatch(/Disallow|Clean-param|noindex:/);
});
