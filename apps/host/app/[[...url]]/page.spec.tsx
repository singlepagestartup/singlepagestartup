/**
 * BDD Suite: resolved Host routes and SEO.
 * Given: localized static/dynamic pages, missing pages and unavailable APIs.
 * When: the catch-all generates metadata or renders a requested URL.
 * Then: the same resolved page supplies HTML/SEO, real absence is 404, and outages propagate.
 */
import { renderToStaticMarkup } from "react-dom/server";
import { api as pageApi } from "@sps/host/models/page/sdk/server";
import { api as metadataApi } from "@sps/host/models/metadata/sdk/server";
import Page, {
  dynamicParams,
  generateMetadata,
  generateStaticParams,
} from "./page";

jest.mock("@sps/host/models/page/sdk/server", () => ({
  api: { urls: jest.fn(), findByUrl: jest.fn() },
}));
jest.mock("@sps/host/models/metadata/sdk/server", () => ({
  api: { generatePageSeo: jest.fn() },
}));
jest.mock("@sps/shared-configuration", () => ({
  internationalization: {
    languages: [{ code: "en" }, { code: "ru" }],
    defaultLanguage: { code: "en" },
  },
}));
jest.mock("@sps/host/models/page/frontend/component", () => ({
  Component: ({ data, language }: any) => (
    <main lang={language}>{data.title}</main>
  ),
}));
jest.mock("../../src/components/admin", () => ({ Component: () => null }));
jest.mock("../../src/components/admin-v2", () => ({
  Component: () => <main>Admin</main>,
}));
jest.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_HTTP_ERROR_FALLBACK;404");
  },
}));

const resolvedPage = {
  id: "page-1",
  variant: "default",
  title: "Article",
  routeParams: {},
};
const request = (url: string[]) => ({ params: Promise.resolve({ url }) });

beforeEach(() => {
  jest.clearAllMocks();
  (pageApi.findByUrl as jest.Mock).mockResolvedValue(resolvedPage);
  (metadataApi.generatePageSeo as jest.Mock).mockResolvedValue({
    metadata: { title: "Article SEO" },
    structuredData: [
      {
        "@type": "Article",
        headline: "Safe </script><script>alert(1)</script>",
      },
    ],
  });
});

describe("resolved Host routes and SEO", () => {
  it("keeps user-owned dynamic routes on demand without global enumeration", async () => {
    expect(dynamicParams).toBe(true);
    expect(await generateStaticParams()).toEqual([]);
    expect(pageApi.urls).not.toHaveBeenCalled();
  });

  it("passes the resolved locale and Page to metadata and renders that Page", async () => {
    const props = request(["ru", "blog", "articles", "sample"]);
    expect(await generateMetadata(props)).toEqual({ title: "Article SEO" });
    const html = renderToStaticMarkup(await Page(props));
    expect(pageApi.findByUrl).toHaveBeenCalledWith({
      url: "/blog/articles/sample",
      language: "ru",
      silentNotFound: true,
    });
    expect(metadataApi.generatePageSeo).toHaveBeenCalledWith({
      url: "/blog/articles/sample",
      language: "ru",
      page: resolvedPage,
    });
    expect(html).toContain('<main lang="ru">Article</main>');
    expect(html).toContain('type="application/ld+json"');
    expect(html).not.toContain("</script><script>");
    const json = html.match(/<script[^>]*>(.*?)<\/script>/)?.[1];
    expect(JSON.parse(json!)[0].headline).toBe(
      "Safe </script><script>alert(1)</script>",
    );
  });

  it("settles missing pages before metadata or page rendering", async () => {
    (pageApi.findByUrl as jest.Mock).mockResolvedValue(undefined);
    await expect(generateMetadata(request(["en", "missing"]))).rejects.toThrow(
      "404",
    );
    await expect(Page(request(["en", "missing"]))).rejects.toThrow("404");
    expect(metadataApi.generatePageSeo).not.toHaveBeenCalled();
  });

  it("propagates API failures instead of classifying them as missing pages", async () => {
    (pageApi.findByUrl as jest.Mock).mockRejectedValue(
      new Error("API unavailable"),
    );
    await expect(Page(request(["en", "article"]))).rejects.toThrow(
      "API unavailable",
    );
  });

  it("marks admin as noindex without resolving it as a content page", async () => {
    expect(
      await generateMetadata(request(["ru", "admin", "host", "pages"])),
    ).toMatchObject({ robots: { index: false, follow: false } });
    expect(
      renderToStaticMarkup(await Page(request(["ru", "admin"]))),
    ).toContain("Admin");
    expect(pageApi.findByUrl).not.toHaveBeenCalled();
    expect(metadataApi.generatePageSeo).not.toHaveBeenCalled();
  });

  it("does not treat administrator as an admin route", async () => {
    await Page(request(["en", "administrator"]));
    expect(pageApi.findByUrl).toHaveBeenCalledWith({
      url: "/administrator",
      language: "en",
      silentNotFound: true,
    });
  });
});
