import { api as metadataToFilesApi } from "@sps/host/relations/metadata-to-file-storage-module-files/sdk/server";
jest.mock(
  "@sps/host/relations/metadata-to-file-storage-module-files/sdk/server",
  () => ({ api: { find: jest.fn() } }),
);
import { api as profilesApi } from "@sps/social/models/profile/sdk/server";
jest.mock("@sps/social/models/profile/sdk/server", () => ({
  api: { find: jest.fn(), authorFind: jest.fn() },
}));
import { api as profileFilesApi } from "@sps/social/relations/profiles-to-file-storage-module-files/sdk/server";
jest.mock(
  "@sps/social/relations/profiles-to-file-storage-module-files/sdk/server",
  () => ({ api: { find: jest.fn() } }),
);
import { api as profileArticlesApi } from "@sps/social/relations/profiles-to-blog-module-articles/sdk/server";
jest.mock(
  "@sps/social/relations/profiles-to-blog-module-articles/sdk/server",
  () => ({ api: { find: jest.fn() } }),
);
import { api as categoryArticlesApi } from "@sps/blog/relations/categories-to-articles/sdk/server";
jest.mock("@sps/blog/relations/categories-to-articles/sdk/server", () => ({
  api: { find: jest.fn() },
}));
import { api as categoryProductsApi } from "@sps/ecommerce/relations/categories-to-products/sdk/server";
jest.mock("@sps/ecommerce/relations/categories-to-products/sdk/server", () => ({
  api: { find: jest.fn() },
}));
/**
 * BDD Suite: public page SEO generation.
 * Given: resolved static, article, product and category pages with editable metadata.
 * When: the Host requests metadata and structured data through its SDK action.
 * Then: the result describes the concrete page, keeps canonical URLs stable and
 * propagates upstream failures instead of publishing an indexable fallback.
 */
import { api as metadataApi } from "../../crud";
import { api as pageApi } from "@sps/host/models/page/sdk/server";
import { api as pagesToMetadataApi } from "@sps/host/relations/pages-to-metadata/sdk/server";
import { api as blogArticleApi } from "@sps/blog/models/article/sdk/server";
import { api as blogCategoryApi } from "@sps/blog/models/category/sdk/server";
import { api as ecommerceProductApi } from "@sps/ecommerce/models/product/sdk/server";
import { api as ecommerceCategoryApi } from "@sps/ecommerce/models/category/sdk/server";
import { api as blogArticlesToFilesApi } from "@sps/blog/relations/articles-to-file-storage-module-files/sdk/server";
import { api as ecommerceProductsToFilesApi } from "@sps/ecommerce/relations/products-to-file-storage-module-files/sdk/server";
import { api as fileStorageFileApi } from "@sps/file-storage/models/file/sdk/server";
import type { IResolvedPage } from "@sps/host/models/page/sdk/model";
import { action, generatePageSeo, resolvePageSeo } from "./index";

jest.mock("../../crud", () => ({
  api: { find: jest.fn(), findById: jest.fn() },
}));
jest.mock("@sps/host/models/page/sdk/server", () => ({
  api: { findByUrl: jest.fn() },
}));
jest.mock("@sps/host/relations/pages-to-metadata/sdk/server", () => ({
  api: { find: jest.fn() },
}));
jest.mock("@sps/blog/models/article/sdk/server", () => ({
  api: { find: jest.fn() },
}));
jest.mock("@sps/blog/models/category/sdk/server", () => ({
  api: { find: jest.fn() },
}));
jest.mock("@sps/ecommerce/models/product/sdk/server", () => ({
  api: { find: jest.fn() },
}));
jest.mock("@sps/ecommerce/models/category/sdk/server", () => ({
  api: { find: jest.fn() },
}));
jest.mock(
  "@sps/blog/relations/articles-to-file-storage-module-files/sdk/server",
  () => ({ api: { find: jest.fn() } }),
);
jest.mock(
  "@sps/ecommerce/relations/products-to-file-storage-module-files/sdk/server",
  () => ({ api: { find: jest.fn() } }),
);
jest.mock("@sps/file-storage/models/file/sdk/server", () => ({
  api: { find: jest.fn() },
}));
jest.mock("@sps/shared-configuration", () => ({
  internationalization: {
    languages: [{ code: "en" }, { code: "ru" }],
    defaultLanguage: { code: "en" },
  },
}));
jest.mock("@sps/shared-utils", () => ({
  ...jest.requireActual(
    "../../../../../../../../../../../shared/utils/src/lib/routes/seo",
  ),
  ...jest.requireActual(
    "../../../../../../../../../../../shared/utils/src/lib/metadata",
  ),
  ...jest.requireActual(
    "../../../../../../../../../../../shared/utils/src/lib/public-read",
  ),
  NEXT_PUBLIC_HOST_SERVICE_URL: "https://example.com",
  NEXT_PUBLIC_API_SERVICE_URL: "https://api.example.com",
  NEXT_PUBLIC_HOST_METADATA_TITLE: "Site ENV",
  NEXT_PUBLIC_HOST_METADATA_DESCRIPTION: "ENV description",
  NEXT_PUBLIC_HOST_METADATA_ICON: "/icon.png",
  NEXT_PUBLIC_HOST_METADATA_KEYWORDS: "one, two",
}));

function page(overrides: Partial<IResolvedPage> = {}): IResolvedPage {
  return {
    id: "page-id",
    title: "Page",
    description: "Description",
    url: "/",
    language: "en",
    routeParams: {},
    ...overrides,
  } as IResolvedPage;
}

function articlePage(slug: string): IResolvedPage {
  return page({
    url: "/blog/articles/[blog.articles.slug]",
    routeParams: { "blog.articles.slug": slug },
  });
}

beforeEach(() => {
  jest.resetAllMocks();
  jest.mocked(metadataToFilesApi.find).mockResolvedValue([]);
  jest.mocked(profilesApi.find).mockResolvedValue([]);
  jest.mocked(profilesApi.authorFind).mockResolvedValue([]);
  jest.mocked(profileFilesApi.find).mockResolvedValue([]);
  jest.mocked(profileArticlesApi.find).mockResolvedValue([]);
  jest.mocked(categoryArticlesApi.find).mockResolvedValue([]);
  jest.mocked(categoryProductsApi.find).mockResolvedValue([]);

  jest.mocked(metadataApi.find).mockResolvedValue([
    {
      id: "primary",
      variant: "primary",
      title: "Site",
      description: "Site description",
      opengraphTitle: "Global social title",
    },
  ] as any);
  jest.mocked(pagesToMetadataApi.find).mockResolvedValue([]);
  jest.mocked(blogArticlesToFilesApi.find).mockResolvedValue([]);
  jest.mocked(ecommerceProductsToFilesApi.find).mockResolvedValue([]);
});

describe("public page SEO generation", () => {
  it("keeps a page segment identical to its locale after route resolution", async () => {
    jest
      .mocked(pageApi.findByUrl)
      .mockResolvedValue(page({ url: "/ru", title: "Russian department" }));
    const result = await resolvePageSeo("/ru", "ru");
    expect(result.metadata.alternates).toEqual({
      canonical: "https://example.com/ru/ru",
    });
    expect(pageApi.findByUrl).toHaveBeenCalledWith({
      url: "/ru",
      language: "ru",
      silentNotFound: true,
    });
  });
  it("resolves the Page before generating its SEO", async () => {
    const resolvedPage = page({ url: "/about", title: "About" });
    jest.mocked(pageApi.findByUrl).mockResolvedValue(resolvedPage);
    const result = await resolvePageSeo("/about", "en");
    expect(pageApi.findByUrl).toHaveBeenCalledWith({
      url: "/about",
      language: "en",
      silentNotFound: true,
    });
    expect(result.page).toBe(resolvedPage);
    expect(result.metadata.title).toBe("About");
  });

  it("uses distinct static page titles and descriptions instead of primary metadata", async () => {
    const first = await action({
      url: "/ru/about",
      page: page({ url: "/about", title: "О нас", description: "О компании" }),
    });
    const second = await action({
      url: "/ru/contacts",
      page: page({
        url: "/contacts",
        title: "Контакты",
        description: "Как связаться",
      }),
    });
    expect(first).toMatchObject({
      title: "О нас",
      description: "О компании",
      alternates: { canonical: "https://example.com/ru/about" },
      openGraph: { title: "О нас", url: "https://example.com/ru/about" },
    });
    expect(second).toMatchObject({
      title: "Контакты",
      description: "Как связаться",
    });
    expect(pageApi.findByUrl).not.toHaveBeenCalled();
    expect(metadataApi.find).toHaveBeenCalledWith(
      expect.objectContaining({
        params: expect.objectContaining({
          filters: {
            and: [{ column: "variant", method: "eq", value: "primary" }],
          },
        }),
      }),
    );
  });

  it("resolves a legacy concrete URL call and excludes tracking parameters from canonical", async () => {
    jest
      .mocked(pageApi.findByUrl)
      .mockResolvedValue(page({ url: "/about", title: "About" }));
    const result = await action({ url: "/en/about?utm_source=ads#top" });
    expect(pageApi.findByUrl).toHaveBeenCalledWith({
      url: "/about",
      language: "en",
      options: undefined,
    });
    expect(result.alternates).toEqual({
      canonical: "https://example.com/en/about",
    });
    expect(result.metadataBase?.href).toBe("https://example.com/");
  });

  it("uses exact entity keys, localized content and article images", async () => {
    jest.mocked(blogArticleApi.find).mockResolvedValue([
      {
        id: "article-id",
        slug: "статья",
        title: { en: "Article", ru: "Статья" },
        subtitle: { ru: "Краткое описание" },
        description: { ru: "Длинное описание" },
      },
    ] as any);
    jest.mocked(blogArticlesToFilesApi.find).mockResolvedValue([
      {
        id: "image-link",
        variant: "default",
        fileStorageModuleFileId: "file-id",
      },
    ] as any);
    jest.mocked(fileStorageFileApi.find).mockResolvedValue([
      {
        id: "file-id",
        file: "/uploads/article.jpg",
        mimeType: "image/jpeg",
        alt: "Автор за столом",
        width: 1200,
        height: 630,
      },
    ] as any);
    const result = await generatePageSeo({
      url: "/ru/blog/articles/%D1%81%D1%82%D0%B0%D1%82%D1%8C%D1%8F",
      page: articlePage("%D1%81%D1%82%D0%B0%D1%82%D1%8C%D1%8F"),
    });
    expect(blogArticleApi.find).toHaveBeenCalledWith({
      options: undefined,
      params: {
        filters: {
          and: [
            { column: "slug", method: "eq", value: "статья" },
            { column: "variant", method: "ne", value: "hidden" },
          ],
        },
      },
    });
    expect(result.metadata).toMatchObject({
      title: "Статья",
      description: "Краткое описание",
      openGraph: {
        type: "article",
        title: "Статья",
      },
      twitter: { card: "summary" },
    });
    expect(result.structuredData[0]).toMatchObject({
      "@type": "BlogPosting",
      headline: "Статья",
      inLanguage: "ru",
      image: "https://api.example.com/public/uploads/article.jpg",
    });
    expect(result.structuredData[0]).not.toHaveProperty("datePublished");
    expect(result.structuredData[0]).not.toHaveProperty("author");
    expect(ecommerceProductApi.find).not.toHaveBeenCalled();
  });

  it("keeps two product slugs distinct and emits no invented offers or logo as product image", async () => {
    jest.mocked(ecommerceProductApi.find).mockImplementation(async (props) => {
      const slug = props?.params?.filters.and[0].value;
      return [
        {
          id: slug,
          slug,
          title: { en: `Product ${slug}` },
          shortDescription: { en: `About ${slug}` },
        },
      ] as any;
    });
    const results = await Promise.all(
      ["first", "second"].map((slug) =>
        generatePageSeo({
          url: `/en/products/${slug}`,
          page: page({
            url: "/products/[ecommerce.products.slug]",
            routeParams: { "ecommerce.products.slug": slug },
          }),
        }),
      ),
    );
    expect(results.map(({ metadata }) => metadata.title)).toEqual([
      "Product first",
      "Product second",
    ]);
    expect(results[0].structuredData[0]).toMatchObject({
      "@type": "Product",
      name: "Product first",
      description: "About first",
    });
    expect(results[0].structuredData[0]).not.toHaveProperty("offers");
    expect(results[0].structuredData[0]).not.toHaveProperty("image");
  });

  it.each([
    ["blog.categories.slug", blogCategoryApi],
    ["ecommerce.categories.slug", ecommerceCategoryApi],
  ])("reads a category through its named %s key", async (key, api) => {
    jest.mocked(api.find).mockResolvedValue([
      {
        id: "category",
        slug: "guides",
        title: { en: "Guides" },
        subtitle: { en: "Practical guides" },
      },
    ] as any);
    const result = await generatePageSeo({
      url: "/en/categories/guides",
      page: page({
        url: `/categories/[${key}]`,
        routeParams: { [key]: "guides" },
      }),
    });
    expect(result.metadata.title).toBe("Guides");
    expect(result.structuredData[0]).toMatchObject({
      "@type": "CollectionPage",
      name: "Guides",
    });
  });

  it("applies ordered explicit page overrides and reusable content placeholders", async () => {
    jest.mocked(blogArticleApi.find).mockResolvedValue([
      {
        id: "article",
        slug: "guide",
        title: { en: "Guide" },
        subtitle: { en: "How to start" },
      },
    ] as any);
    jest
      .mocked(pagesToMetadataApi.find)
      .mockResolvedValue([
        { metadataId: "first" },
        { metadataId: "second" },
      ] as any);
    jest.mocked(metadataApi.find).mockImplementation(async (props) => {
      const id = props?.params?.filters.and[0].value;
      if (id === "primary") return [];
      return [
        {
          id,
          title: "[blog.articles.title] | Editorial",
          description: null,
          opengraphTitle: "Share [blog.articles.title]",
          twitterTitle: "Tweet [blog.articles.title]",
          opengraphUrl: "https://example.com/social/guide",
          author: "Editorial team",
        },
      ] as any;
    });
    const result = await generatePageSeo({
      url: "/en/blog/articles/guide",
      page: articlePage("guide"),
    });
    expect(result.metadata).toMatchObject({
      title: "Guide | Editorial",
      description: "How to start",
      authors: [{ name: "Editorial team" }],
      alternates: { canonical: "https://example.com/en/blog/articles/guide" },
      openGraph: {
        title: "Share Guide",
        url: "https://example.com/social/guide",
      },
      twitter: { title: "Tweet Guide" },
    });
    expect(result.structuredData[0]).toMatchObject({
      headline: "Guide",
    });
    expect(pagesToMetadataApi.find).toHaveBeenCalledWith({
      options: undefined,
      params: {
        filters: {
          and: [
            { column: "pageId", method: "eq", value: "page-id" },
            { column: "variant", method: "ne", value: "hidden" },
          ],
        },
        orderBy: {
          and: [
            { column: "orderIndex", method: "asc" },
            { column: "id", method: "asc" },
          ],
        },
      },
    });
  });

  it("extracts readable description text from TipTap JSON without concatenating paragraphs", async () => {
    jest.mocked(blogArticleApi.find).mockResolvedValue([
      {
        id: "article",
        slug: "guide",
        title: { en: "Guide" },
        description: {
          en: JSON.stringify({
            type: "doc",
            content: [
              {
                type: "paragraph",
                content: [{ type: "text", text: "First paragraph." }],
              },
              {
                type: "paragraph",
                content: [{ type: "text", text: "Second paragraph." }],
              },
            ],
          }),
        },
      },
    ] as any);
    const result = await action({
      url: "/en/blog/articles/guide",
      page: articlePage("guide"),
    });
    expect(result.description).toBe("First paragraph. Second paragraph.");
  });

  it("does not query unrelated entity collections for a static page", async () => {
    const result = await action({
      url: "/en/guide",
      page: page({ url: "/guide", routeParams: { slug: "not-a-named-key" } }),
    });
    expect(result.title).toBe("Site");
    expect(result.description).toBe("Site description");
    expect(result.openGraph).toMatchObject({ title: "Site" });
    expect(blogArticleApi.find).not.toHaveBeenCalled();
    expect(ecommerceProductApi.find).not.toHaveBeenCalled();
  });

  it("does not invent a breadcrumb hierarchy for pages without breadcrumb data", async () => {
    const result = await generatePageSeo({
      url: "/en/about",
      page: page({ url: "/about", title: "About" }),
    });
    expect(result.structuredData).toEqual([]);
  });

  it("preserves the page number in canonical and distinguishes paginated titles", async () => {
    const result = await action({
      url: "/ru/blog/2",
      page: page({
        title: "Статьи",
        description: "Материалы блога",
        url: "/blog/[blog.articles.:pagination:10]",
        routeParams: { "blog.articles.:pagination:10": "2" },
      }),
    });
    expect(result).toMatchObject({
      title: "Статьи — Страница 2",
      description: "Материалы блога Страница 2.",
      alternates: { canonical: "https://example.com/ru/blog/2" },
    });
  });

  it("marks private pages noindex without reading metadata or private entities", async () => {
    const result = await generatePageSeo({
      url: "/en/ai-chat/projects",
      page: page({ url: "/ai-chat/projects" }),
    });
    expect(result.metadata.robots).toEqual({ index: false, follow: false });
    expect(result.structuredData).toEqual([]);
    expect(metadataApi.find).not.toHaveBeenCalled();
    expect(blogArticleApi.find).not.toHaveBeenCalled();
  });

  it("keeps API outages observable even when a legacy caller passes catchErrors", async () => {
    jest
      .mocked(metadataApi.find)
      .mockRejectedValue(new Error("API unavailable"));
    await expect(
      action({
        url: "/en/about",
        page: page({ url: "/about" }),
        catchErrors: true,
      }),
    ).rejects.toThrow("API unavailable");
  });

  it("does not publish fallback metadata for a deleted entity", async () => {
    jest.mocked(blogArticleApi.find).mockResolvedValue([]);
    await expect(
      action({
        url: "/en/blog/articles/deleted",
        page: articlePage("deleted"),
      }),
    ).rejects.toThrow("NEXT_HTTP_ERROR_FALLBACK;404");
  });

  it("does not read entity collections when the page lookup fails", async () => {
    jest
      .mocked(pageApi.findByUrl)
      .mockRejectedValue(new Error("Page API unavailable"));
    await expect(action({ url: "/en/blog/articles/guide" })).rejects.toThrow(
      "Page API unavailable",
    );
    expect(blogArticleApi.find).not.toHaveBeenCalled();
    expect(metadataApi.find).not.toHaveBeenCalled();
  });
});

function selectedMetadata(record: Record<string, unknown>) {
  jest
    .mocked(pagesToMetadataApi.find)
    .mockResolvedValue([{ metadataId: "custom", variant: "default" }] as any);
  jest
    .mocked(metadataApi.find)
    .mockImplementation(async (props) =>
      props?.params?.filters.and[0].value === "custom"
        ? ([{ id: "custom", variant: "default", ...record }] as any)
        : [],
    );
}
function publicArticle(overrides: Record<string, unknown> = {}) {
  jest.mocked(blogArticleApi.find).mockResolvedValue([
    {
      id: "article",
      slug: "guide",
      variant: "default",
      title: { en: "Guide" },
      ...overrides,
    },
  ] as any);
}
it("resolves JSON keywords and an explicit relation image mask", async () => {
  publicArticle({
    metadata: { seo: { keywords: { en: ["guide", "property"] } } },
  });
  selectedMetadata({
    title: "[blog.articles.title]",
    keywords: "[blog.articles.metadata.seo.keywords]",
    opengraphImage:
      "[blog.articles>blog.articles-to-file-storage-module-files>file-storage.files.file]",
  });
  jest
    .mocked(blogArticlesToFilesApi.find)
    .mockResolvedValue([
      { id: "cover", fileStorageModuleFileId: "image" },
    ] as any);
  jest
    .mocked(fileStorageFileApi.find)
    .mockResolvedValue([
      { id: "image", file: "/cover.jpg", mimeType: "image/jpeg" },
    ] as any);
  const { metadata } = await generatePageSeo({
    url: "/en/blog/guide",
    page: articlePage("guide"),
  });
  expect(metadata.keywords).toEqual(["guide", "property"]);
  expect(metadata.openGraph).toMatchObject({
    images: [{ url: "https://api.example.com/public/cover.jpg" }],
  });
  expect(metadataToFilesApi.find).not.toHaveBeenCalled();
});
it.each(["[blog.articles.title] suffix", "[blog.articles.metadata.internal]"])(
  "falls back the whole unresolved field %s",
  async (title) => {
    publicArticle({
      title: { ru: "Руководство" },
      metadata: {
        internal: "private",
        seo: { title: { en: "Editorial guide" } },
      },
    });
    selectedMetadata({ title });
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    const result = await action({
      url: "/en/blog/guide",
      page: articlePage("guide"),
    });
    expect(result.title).toBe("Editorial guide");
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  },
);
it("uses linked Metadata covers for static pages without fabricating JSON-LD images", async () => {
  selectedMetadata({ title: "About" });
  jest
    .mocked(metadataToFilesApi.find)
    .mockResolvedValue([
      { id: "cover", fileStorageModuleFileId: "image" },
    ] as any);
  jest
    .mocked(fileStorageFileApi.find)
    .mockResolvedValue([
      { id: "image", file: "/about.jpg", mimeType: "image/jpeg" },
    ] as any);
  const result = await generatePageSeo({
    url: "/en/about",
    page: page({ url: "/about" }),
  });
  expect(result.metadata.openGraph).toMatchObject({
    images: [{ url: "https://api.example.com/public/about.jpg" }],
  });
  expect(result.structuredData).toEqual([]);
});
it("keeps an article available when only its optional cover relation is hidden", async () => {
  publicArticle();
  jest
    .mocked(blogArticlesToFilesApi.find)
    .mockResolvedValue([
      { id: "cover", variant: "hidden", fileStorageModuleFileId: "image" },
    ] as any);
  const result = await generatePageSeo({
    url: "/en/blog/guide",
    page: articlePage("guide"),
  });
  expect(result.metadata.title).toBe("Guide");
  expect(result.structuredData[0]).not.toHaveProperty("image");
  expect(fileStorageFileApi.find).not.toHaveBeenCalled();
});
it("does not render hidden pages or hidden primary entities", async () => {
  await expect(
    action({ url: "/en/about", page: page({ variant: "hidden" }) }),
  ).rejects.toThrow("404");
  publicArticle({ variant: "hidden" });
  await expect(
    action({ url: "/en/blog/guide", page: articlePage("guide") }),
  ).rejects.toThrow("404");
});
it("honors explicit noindex and omits structured data", async () => {
  publicArticle();
  const result = await generatePageSeo({
    url: "/en/blog/guide",
    page: { ...articlePage("guide"), indexing: "noindex" },
  });
  expect(result.metadata.robots).toMatchObject({ index: false });
  expect(result.structuredData).toEqual([]);
});

it("does not leak unresolved masks in social handles or locale", async () => {
  jest.mocked(metadataApi.find).mockResolvedValue([
    {
      id: "primary",
      variant: "primary",
      title: "Site",
      twitterSite: "[blog.articles.title]",
      twitterCreator: "[blog.articles.title]",
      opengraphLocale: "[blog.articles.title]",
    },
  ] as any);
  const result = await generatePageSeo({ url: "/", page: page() });
  expect(JSON.stringify(result.metadata)).not.toContain(
    "[blog.articles.title]",
  );
  expect(result.diagnostics).toContain(
    "No social cover is configured for this page",
  );
});

it("uses only the public author DTO for Profile metadata and avatar", async () => {
  const id = "61ed455d-8cce-458f-9992-a12e1fcb449a";
  jest.mocked(profilesApi.authorFind).mockResolvedValue([
    {
      id,
      title: { en: "Public author" },
      subtitle: {},
      description: {},
      metadata: {
        seo: { title: { en: "Author SEO" }, keywords: { en: ["writing"] } },
      },
      avatar: { id: "avatar", file: "/avatar.png", mimeType: "image/png" },
    },
  ] as any);
  const result = await generatePageSeo({
    url: `/authors/${id}`,
    language: "en",
    page: page({
      url: "/authors/[social.profiles.id]",
      routeParams: { "social.profiles.id": id },
    }),
  });
  expect(result.metadata.title).toBe("Author SEO");
  expect(result.metadata.keywords).toEqual(["writing"]);
  expect(profilesApi.authorFind).toHaveBeenCalledWith({
    params: { profileId: id },
    options: undefined,
  });
  expect(profilesApi.find).not.toHaveBeenCalled();
  expect(profileFilesApi.find).not.toHaveBeenCalled();
});
