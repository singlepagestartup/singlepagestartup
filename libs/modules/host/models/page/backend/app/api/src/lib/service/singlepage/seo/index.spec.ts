import { SeoService } from "./index";
import { api as metadata } from "@sps/host/models/metadata/sdk/server";
import { api as linksApi } from "@sps/host/relations/pages-to-metadata/sdk/server";
import type { IResolvedPage } from "@sps/host/models/page/sdk/model";
import type { RoutingService } from "@sps/host/models/page/backend/app/api/src/lib/service/singlepage/routing";
jest.mock("@sps/host/models/metadata/sdk/server", () => ({
  api: { find: jest.fn() },
}));
jest.mock("@sps/host/relations/pages-to-metadata/sdk/server", () => ({
  api: { find: jest.fn() },
}));
jest.mock("@sps/shared-configuration", () => ({
  internationalization: {
    languages: [{ code: "ru" }, { code: "en" }],
    defaultLanguage: { code: "ru" },
  },
}));
const page = (extra: object = {}) =>
  ({
    id: "page",
    variant: "default",
    url: "/about",
    language: "ru",
    title: "About",
    description: "Description",
    routeParams: {},
    ...extra,
  }) as IResolvedPage;
const pages = { findByUrl: jest.fn() };
let seo: SeoService;
let find: jest.Mock;
let all: jest.Mock;
beforeEach(() => {
  jest.resetAllMocks();
  seo = new SeoService(pages);
  find = jest.fn(async () => []);
  all = jest.fn(async () => []);
  seo.routing = {
    find,
    all,
    relation: () => ({
      source: "host.metadata",
      sourceKey: "metadataId",
      target: "file-storage.files",
      targetKey: "fileStorageModuleFileId",
    }),
  } as unknown as RoutingService;
  jest
    .mocked(linksApi.find)
    .mockResolvedValue([
      { id: "link", metadataId: "meta", variant: "default" },
    ] as any);
  jest.mocked(metadata.find).mockResolvedValue([
    {
      id: "meta",
      variant: "default",
      title: "[custom.items.name]",
      description: "[custom.items.summary]",
      keywords: "[custom.items.metadata.seo.keywords]",
      opengraphImage: "https://example.com/cover.webp",
    },
  ]);
});
it("uses related Metadata masks for any registered source without inferring entity SEO", async () => {
  find.mockResolvedValue([
    {
      id: "item",
      slug: "one",
      name: { ru: "Название" },
      summary: { ru: "Описание" },
      metadata: {
        seo: {
          title: { ru: "Unused automatic override" },
          keywords: { ru: ["one", "two"] },
        },
      },
    },
  ]);
  const result = await seo.generate({
    url: "/ru/portfolio/one",
    page: page({
      url: "/portfolio/[custom.items.slug]",
      routeParams: { "custom.items.slug": "one" },
    }),
  });
  expect(result.metadata.title).toBe("Название");
  expect(result.metadata.description).toBe("Описание");
  expect(result.metadata.keywords).toEqual(["one", "two"]);
  expect(result.structuredData[0]["@type"]).toBe("WebPage");
});
it("does not preload domain entities when Metadata contains literals", async () => {
  jest.mocked(metadata.find).mockResolvedValue([
    {
      id: "meta",
      variant: "default",
      title: "Literal page",
      description: "Owner's text",
      opengraphImage: "https://example.com/cover.webp",
    },
  ]);
  const result = await seo.generate({
    url: "/blog/one",
    page: page({ routeParams: { "blog.articles.slug": "one" } }),
  });
  expect(result.metadata.title).toBe("Literal page");
  expect(find).not.toHaveBeenCalled();
});
it("decides indexability only from the Page variant, even under a formerly excluded URL", async () => {
  jest.mocked(metadata.find).mockResolvedValue([
    {
      id: "meta",
      title: "Public chat landing",
      opengraphImage: "https://example.com/a.webp",
    },
  ]);
  const result = await seo.generate({
    url: "/ai-chat/features",
    page: page({ url: "/ai-chat/features" }),
  });
  expect(result.metadata.robots?.index).toBe(true);
});
it("keeps noindex Page available while excluding structured data", async () => {
  const result = await seo.generate({
    url: "/account",
    page: page({ variant: "noindex" }),
  });
  expect(result.metadata.robots?.index).toBe(false);
  expect(result.structuredData).toEqual([]);
});
it.each(["hidden", "draft"])("rejects %s Page", async (variant) => {
  await expect(
    seo.generate({ url: "/about", page: page({ variant }) }),
  ).rejects.toThrow("Not Found");
});
it("retains Page fallback if Metadata is absent", async () => {
  jest.mocked(linksApi.find).mockResolvedValue([]);
  jest.mocked(metadata.find).mockResolvedValue([]);
  const result = await seo.generate({
    url: "/about",
    page: page({ title: "О нас", description: "О компании" }),
  });
  expect(result.metadata.title).toBe("О нас");
  expect(result.metadata.description).toBe("О компании");
});
it("uses primary Metadata when the Page has no meaningful text", async () => {
  jest.mocked(linksApi.find).mockResolvedValue([]);
  jest.mocked(metadata.find).mockResolvedValue([
    {
      id: "primary",
      variant: "primary",
      title: "Site fallback",
      opengraphImage: "https://example.com/a.webp",
    },
  ]);
  const result = await seo.generate({
    url: "/",
    page: page({ title: "Page" }),
  });
  expect(result.metadata.title).toBe("Site fallback");
});
it("keeps mask diagnostics separate from the Page publication decision", async () => {
  const result = await seo.generate({ url: "/about", page: page() });
  expect(result.metadata.title).toBe("About");
  expect(result.metadata.robots?.index).toBe(true);
  expect(
    result.diagnostics?.some((message) => message.includes("No route context")),
  ).toBe(true);
});
it("resolves an existing Metadata cover through the registered relation schema", async () => {
  jest
    .mocked(metadata.find)
    .mockResolvedValue([{ id: "meta", title: "Page title" }]);
  all.mockResolvedValue([
    { id: "link", metadataId: "meta", fileStorageModuleFileId: "file" },
  ]);
  find.mockResolvedValue([
    {
      id: "file",
      file: "/image.webp",
      mimeType: "image/webp",
      width: 1200,
      height: 630,
    },
  ]);
  const result = await seo.generate({ url: "/about", page: page() });
  expect(result.metadata.openGraph?.images?.[0]).toMatchObject({
    width: 1200,
    height: 630,
  });
});
it("previews current unsaved Metadata for the selected Page without changing publication", async () => {
  jest.mocked(pages.findByUrl).mockResolvedValue(page({ variant: "noindex" }));
  const result = await seo.preview({
    url: "/ru/account",
    metadata: {
      title: "Unsaved title",
      opengraphImage: "https://example.com/a.webp",
    },
  });
  expect(result.metadata.title).toBe("Unsaved title");
  expect(result.metadata.robots?.index).toBe(false);
});
it("does not infer visibility from Metadata, association or File presentation variants", async () => {
  jest
    .mocked(linksApi.find)
    .mockResolvedValue([
      { id: "link", metadataId: "meta", variant: "hidden" },
    ] as any);
  jest
    .mocked(metadata.find)
    .mockResolvedValue([
      { id: "meta", variant: "hidden", title: "Selected Metadata" },
    ]);
  all.mockResolvedValue([
    {
      id: "cover-link",
      metadataId: "meta",
      fileStorageModuleFileId: "cover",
      variant: "hidden",
    },
  ]);
  find.mockResolvedValue([
    {
      id: "cover",
      file: "/cover.webp",
      mimeType: "image/webp",
      variant: "hidden",
    },
  ]);
  const result = await seo.generate({ url: "/about", page: page() });
  expect(result.metadata.title).toBe("Selected Metadata");
  expect(result.metadata.openGraph?.images?.[0]?.url).toMatch(
    /\/public\/cover.webp$/,
  );
  expect(result.metadata.robots?.index).toBe(true);
});
it("preserves pagination and localized concrete URLs", async () => {
  jest.mocked(metadata.find).mockResolvedValue([
    {
      id: "meta",
      title: "Новости",
      description: "Статьи",
      opengraphImage: "https://example.com/a.webp",
    },
  ]);
  const result = await seo.generate({
    url: "/ru/news/2?utm_source=test",
    page: page({ routeParams: { "custom.posts.:pagination:10": "2" } }),
  });
  expect(result.metadata.title).toBe("Новости — Страница 2");
  expect(result.metadata.alternates?.canonical).toMatch(/\/ru\/news\/2$/);
});
it("propagates source outages instead of caching fallback output", async () => {
  find.mockRejectedValue(new Error("offline"));
  await expect(
    seo.generate({
      url: "/one",
      page: page({ routeParams: { "custom.items.slug": "one" } }),
    }),
  ).rejects.toThrow("offline");
});
it("preserves an already resolved path identical to its language", async () => {
  jest.mocked(pages.findByUrl).mockResolvedValue(page({ url: "/ru" }));
  jest.mocked(metadata.find).mockResolvedValue([
    {
      id: "meta",
      title: "Russian department",
      opengraphImage: "https://example.com/a.webp",
    },
  ]);
  expect((await seo.resolve("/ru/ru")).metadata.alternates?.canonical).toMatch(
    /\/ru\/ru$/,
  );
});

it("resolves its Page through the owning service before reading related Metadata", async () => {
  pages.findByUrl.mockResolvedValue(page());
  await seo.resolve("/ru/about");
  expect(pages.findByUrl).toHaveBeenCalledWith({
    url: "/about",
  });
  expect(linksApi.find).toHaveBeenCalledWith(
    expect.objectContaining({
      params: expect.objectContaining({
        filters: { and: [{ column: "pageId", method: "eq", value: "page" }] },
      }),
    }),
  );
  expect(metadata.find).toHaveBeenCalledWith(
    expect.objectContaining({
      params: {
        filters: { and: [{ column: "id", method: "eq", value: "meta" }] },
      },
    }),
  );
});

it("uses one Page for Russian, English and default-language SEO", async () => {
  const shared = page({
    metadata: {
      seo: {
        title: { ru: "О фреймворке", en: "About the framework" },
        description: { ru: "Веб-разработка", en: "Web development" },
      },
    },
  });
  pages.findByUrl.mockResolvedValue(shared);
  jest.mocked(metadata.find).mockResolvedValue([
    {
      id: "meta",
      title: "[host.pages.metadata.seo.title]",
      description: "[host.pages.metadata.seo.description]",
    },
  ] as any);
  const implicit = await seo.resolve("/about");
  const russian = await seo.resolve("/ru/about");
  const english = await seo.resolve("/en/about");
  expect([implicit.page.id, russian.page.id, english.page.id]).toEqual([
    "page",
    "page",
    "page",
  ]);
  expect(implicit.metadata.title).toBe("О фреймворке");
  expect(russian.metadata.title).toBe("О фреймворке");
  expect(english.metadata.title).toBe("About the framework");
  expect(english.metadata.description).toBe("Web development");
  expect(english.metadata.alternates?.canonical).toMatch(/\/en\/about$/);
  expect(
    pages.findByUrl.mock.calls.every(
      ([props]) => JSON.stringify(props) === '{"url":"/about"}',
    ),
  ).toBe(true);
});
