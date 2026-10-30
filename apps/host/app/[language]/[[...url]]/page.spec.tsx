/**
 * BDD Suite: public Host route delegation.
 * Given: a locale and a concrete path.
 * When: Next prepares metadata or renders a route.
 * Then: model readers own document data and unsupported locales return 404.
 */
import { renderToStaticMarkup } from "react-dom/server";
import { api as metadataApi } from "@sps/host/models/metadata/sdk/server";
import Page, {
  revalidate,
  dynamicParams,
  generateMetadata,
  generateStaticParams,
} from "./page";
jest.mock("@sps/host/models/metadata/sdk/server", () => ({
  api: { resolvePageSeo: jest.fn() },
}));
jest.mock("@sps/shared-configuration", () => ({
  internationalization: { languages: [{ code: "en" }, { code: "ru" }] },
}));
jest.mock("@sps/host/models/page/frontend/component", () => ({
  Component: ({ variant, url, language }: any) => (
    <main data-variant={variant} lang={language}>
      {url}
    </main>
  ),
}));
jest.mock("../../../src/components/admin", () => ({ Component: () => null }));
jest.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_HTTP_ERROR_FALLBACK;404");
  },
}));
const request = (language: string, url: string[] = []) => ({
  params: Promise.resolve({ language, url }),
});
beforeEach(() => {
  jest.clearAllMocks();
  jest
    .mocked(metadataApi.resolvePageSeo)
    .mockResolvedValue({ metadata: { title: "SEO" } } as any);
});
it("enables on-demand ISR without enumerating all user-owned entities", async () => {
  expect(revalidate).toBe(3600);
  expect(dynamicParams).toBe(true);
  expect(await generateStaticParams()).toEqual([]);
});
it("delegates localized SEO to its model SDK", async () => {
  expect(await generateMetadata(request("ru", ["blog", "example"]))).toEqual({
    title: "SEO",
  });
  expect(metadataApi.resolvePageSeo).toHaveBeenCalledWith(
    "/blog/example",
    "ru",
  );
});
it("renders the document model with explicit route inputs", async () => {
  const html = renderToStaticMarkup(await Page(request("en", ["about"])));
  expect(html).toContain('data-variant="document"');
  expect(html).toContain('lang="en"');
  expect(html).toContain("/about");
});
it("rejects unsupported locales before reading SEO", async () => {
  await expect(generateMetadata(request("zz"))).rejects.toThrow("404");
  await expect(Page(request("zz"))).rejects.toThrow("404");
  expect(metadataApi.resolvePageSeo).not.toHaveBeenCalled();
});

it("preserves Next-escaped delimiters without encoding them a second time", async () => {
  await generateMetadata(request("ru", ["blog", "a%2Fb"]));
  expect(metadataApi.resolvePageSeo).toHaveBeenCalledWith("/blog/a%2Fb", "ru");
});
