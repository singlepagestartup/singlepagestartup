import { describe, expect, it } from "bun:test";
import { randomUUID } from "node:crypto";
import type { IWidgetCutoverAdapter } from "./ai-chat-widget-links";
import {
  applyBlogExamples,
  blogExampleCli,
  prepareBlogExamples,
  verifyBlogExamples,
  type IBlogExampleInput,
  type IBlogReference,
} from "./blog-example-content";

const refs: IBlogReference[] = [
  {
    entity: "blog.categories-to-articles",
    column: "articleId",
    target: "blog.article",
  },
  {
    entity: "blog.widgets-to-articles",
    column: "articleId",
    target: "blog.article",
  },
  {
    entity: "blog.articles-to-file-storage-module-files",
    column: "articleId",
    target: "blog.article",
  },
  {
    entity: "blog.articles-to-website-builder-module-widgets",
    column: "articleId",
    target: "blog.article",
  },
  {
    entity: "blog.articles-to-ecommerce-module-products",
    column: "articleId",
    target: "blog.article",
  },
  {
    entity: "social.profiles-to-blog-module-articles",
    column: "blogModuleArticleId",
    target: "blog.article",
  },
  {
    entity: "blog.articles-to-website-builder-module-widgets",
    column: "websiteBuilderModuleWidgetId",
    target: "website-builder.widget",
  },
  {
    entity: "website-builder.widgets-to-features",
    column: "widgetId",
    target: "website-builder.widget",
  },
  {
    entity: "website-builder.widgets-to-features",
    column: "featureId",
    target: "website-builder.feature",
  },
  {
    entity: "website-builder.features-to-file-storage-module-files",
    column: "featureId",
    target: "website-builder.feature",
  },
  {
    entity: "website-builder.features-to-file-storage-module-files",
    column: "fileStorageModuleFileId",
    target: "file-storage.file",
  },
];
const copy = (slug: string) => ({
  slug,
  adminTitle: slug,
  title: { en: slug, ru: `ru ${slug}` },
  subtitle: { en: "Introduction", ru: "Введение" },
  description: {
    en: JSON.stringify({
      type: "doc",
      content: [{ type: "paragraph", content: [{ type: "text", text: slug }] }],
    }),
    ru: JSON.stringify({
      type: "doc",
      content: [
        { type: "paragraph", content: [{ type: "text", text: `ru ${slug}` }] },
      ],
    }),
  },
});
function setup() {
  const rows = new Map<string, Map<string, any>>();
  const put = (entity: string, row: any) => {
    if (!rows.has(entity)) rows.set(entity, new Map());
    rows.get(entity)!.set(row.id, structuredClone(row));
  };
  const all = (entity: string) =>
    [...(rows.get(entity)?.values() ?? [])].map((row) => structuredClone(row));
  const get = (entity: string, id: string) =>
    structuredClone(rows.get(entity)?.get(id));
  const writes: { entity: string; action: string; id: string }[] = [];
  let unknownCreate = "",
    unknownDelete = "",
    serial = 0;
  const input: IBlogExampleInput = {
    schema: "sps.blog-example-content-input.v1",
    categories: Array.from({ length: 3 }, (_, index) => ({
      id: `category-${index}`,
      ...copy(`new-category-${index}`),
    })),
    articles: Array.from({ length: 6 }, (_, index) => ({
      ...copy(index === 3 ? "saved-private-slug" : `article-${index}`),
      key: `key-${index}`,
      ...(index === 3 ? { id: "private-article" } : {}),
      categoryId: `category-${Math.floor(index / 2)}`,
      coverFileId: `cover-${index}`,
    })),
    author: {
      slug: "sps-editorial",
      title: {
        en: "SinglePageStartup editorial",
        ru: "Редакция SinglePageStartup",
      },
      avatarFileId: "avatar",
    },
    articleWidgets: [
      {
        widgetId: "main",
        articleKeys: Array.from({ length: 6 }, (_, index) => `key-${index}`),
      },
      { widgetId: "popular", articleKeys: ["key-0", "key-2", "key-4"] },
    ],
    categoryWidgets: [
      {
        widgetId: "categories",
        categoryIds: ["category-0", "category-1", "category-2"],
      },
    ],
    deleteArticles: Array.from({ length: 8 }, (_, index) => ({
      id: `old-${index}`,
      slug: `old-slug-${index}`,
    })),
    protectedArticleIds: ["private-article"],
    publicReadPaths: [
      "/api/social/profiles-to-blog-module-articles",
      "/api/social/profiles-to-file-storage-module-files",
    ],
  };
  for (const [index, category] of input.categories.entries())
    put("blog.category", {
      ...copy(`old-category-${index}`),
      id: category.id,
      variant: "default",
      className: "saved-category-class",
    });
  put("blog.article", {
    ...copy("saved-private-slug"),
    id: "private-article",
    variant: "default",
    className: "saved-article-class",
  });
  put("blog.categories-to-articles", {
    id: "private-old-category",
    articleId: "private-article",
    categoryId: "category-0",
    variant: "default",
    orderIndex: 7,
  });
  for (const target of input.deleteArticles) {
    put("blog.article", { ...copy(target.slug), id: target.id });
    put("blog.widgets-to-articles", {
      id: `main-${target.id}`,
      articleId: target.id,
      widgetId: "main",
      variant: "default",
      orderIndex: 0,
    });
    put("blog.categories-to-articles", {
      id: `category-${target.id}`,
      articleId: target.id,
      categoryId: "category-0",
      variant: "default",
      orderIndex: 0,
    });
  }
  put("blog.articles-to-ecommerce-module-products", {
    id: "cross-promo",
    articleId: "old-0",
    ecommerceModuleProductId: "catalog-product",
    variant: "default",
  });
  put("ecommerce.product", { id: "catalog-product", slug: "keep-product" });
  for (const id of ["main", "popular", "categories"])
    put("blog.widget", { id, slug: id, variant: "default" });
  for (const id of [
    ...input.articles.map((row) => row.coverFileId),
    "avatar",
    "private-file",
  ])
    put("file-storage.file", {
      id,
      file: `/file-storage/${id}.png`,
      mimeType: "image/png",
    });
  put("blog.articles-to-website-builder-module-widgets", {
    id: "private-root",
    articleId: "private-article",
    websiteBuilderModuleWidgetId: "secret-widget",
    variant: "private",
  });
  put("blog.articles-to-ecommerce-module-products", {
    id: "private-requirement",
    articleId: "private-article",
    ecommerceModuleProductId: "subscription",
    variant: "subscription",
  });
  put("website-builder.widget", {
    id: "secret-widget",
    description: { en: "PRIVATE-MARKER" },
  });
  put("website-builder.widgets-to-features", {
    id: "secret-feature-link",
    widgetId: "secret-widget",
    featureId: "secret-feature",
  });
  put("website-builder.feature", {
    id: "secret-feature",
    title: { en: "Saved protected feature" },
  });
  put("website-builder.features-to-file-storage-module-files", {
    id: "secret-file-link",
    featureId: "secret-feature",
    fileStorageModuleFileId: "private-file",
  });
  const adapter: IWidgetCutoverAdapter = async (entity) =>
    ({
      find: async (props: any) =>
        all(entity)
          .filter((row) =>
            (props?.params?.filters?.and ?? []).every(
              (filter: any) => row[filter.column] === filter.value,
            ),
          )
          .sort((a, b) => String(a.id).localeCompare(String(b.id)))
          .slice(
            props?.params?.offset ?? 0,
            (props?.params?.offset ?? 0) +
              (props?.params?.limit ?? Number.MAX_SAFE_INTEGER),
          ),
      create: async ({ data }: any) => {
        const row = {
          variant: "default",
          ...data,
          id: randomUUID(),
          createdAt: "2026-10-23T00:00:00.000Z",
          updatedAt: `write-${++serial}`,
        };
        put(entity, row);
        writes.push({ entity, action: "create", id: row.id });
        if (unknownCreate === entity) {
          unknownCreate = "";
          throw Error("Unknown create outcome");
        }
        return structuredClone(row);
      },
      update: async ({ id, data }: any) => {
        const row = {
          ...get(entity, id),
          ...data,
          updatedAt: `write-${++serial}`,
        };
        put(entity, row);
        writes.push({ entity, action: "update", id });
        return structuredClone(row);
      },
      delete: async ({ id }: any) => {
        const row = get(entity, id);
        rows.get(entity)?.delete(id);
        if (entity === "blog.article")
          for (const ref of refs.filter(
            (item) => item.target === "blog.article",
          ))
            for (const relation of all(ref.entity))
              if (relation[ref.column] === id)
                rows.get(ref.entity)?.delete(relation.id);
        writes.push({ entity, action: "delete", id });
        if (unknownDelete === entity) {
          unknownDelete = "";
          throw Error("Unknown delete outcome");
        }
        return row;
      },
    }) as any;
  return {
    adapter,
    input,
    put,
    get,
    all,
    writes,
    unknownCreate: (entity: string) => {
      unknownCreate = entity;
    },
    unknownDelete: (entity: string) => {
      unknownDelete = entity;
    },
  };
}

describe("curated Blog publication", () => {
  it("publishes the full graph before exact retirement, preserves private closure and repeats without writes", async () => {
    const fixture = setup();
    const beforePrivate = fixture.get(
      "website-builder.widget",
      "secret-widget",
    );
    const manifest = await prepareBlogExamples(
      fixture.input,
      fixture.adapter,
      refs,
    );
    expect(fixture.writes).toHaveLength(0);
    expect(manifest.deletion).toHaveLength(8);
    expect(
      manifest.deletion
        .find((row) => row.article.id === "old-0")!
        .cascades.some((row) => row.row.id === "cross-promo"),
    ).toBe(true);
    const saved: any[] = [];
    await applyBlogExamples(manifest, fixture.adapter, async (state) => {
      saved.push(structuredClone(state));
    });
    expect(fixture.all("blog.article")).toHaveLength(6);
    expect(fixture.all("social.profile")).toHaveLength(1);
    expect(fixture.all("social.profiles-to-blog-module-articles")).toHaveLength(
      6,
    );
    expect(
      fixture.all("blog.articles-to-file-storage-module-files"),
    ).toHaveLength(6);
    expect(fixture.get("website-builder.widget", "secret-widget")).toEqual(
      beforePrivate,
    );
    expect(fixture.get("ecommerce.product", "catalog-product")).toBeDefined();
    expect(fixture.get("blog.article", "private-article").slug).toBe(
      "saved-private-slug",
    );
    expect(fixture.get("blog.article", "private-article").className).toBe(
      "saved-article-class",
    );
    const firstDelete = fixture.writes.findIndex(
      (row) => row.entity === "blog.article" && row.action === "delete",
    );
    expect(
      fixture.writes.slice(firstDelete).every((row) => row.action === "delete"),
    ).toBe(true);
    const verified = await verifyBlogExamples(manifest, fixture.adapter);
    expect(verified.protectedGraph).toBe("unchanged");
    expect(
      (await applyBlogExamples(manifest, fixture.adapter, async () => {}))
        .writes,
    ).toBe(0);
    const repeat = await prepareBlogExamples(
      fixture.input,
      fixture.adapter,
      refs,
    );
    expect(repeat.operations).toHaveLength(0);
    expect(
      saved.some((row) =>
        row.operations.some((op: any) => op.state === "started"),
      ),
    ).toBe(true);
  });
  it("recovers an unknown create with its exact natural selector and remaps every foreign key", async () => {
    const fixture = setup();
    const manifest = await prepareBlogExamples(
      fixture.input,
      fixture.adapter,
      refs,
    );
    fixture.unknownCreate("blog.article");
    let persisted = structuredClone(manifest);
    const persist = async (state: typeof manifest) => {
      persisted = structuredClone(state);
    };
    await expect(
      applyBlogExamples(manifest, fixture.adapter, persist),
    ).rejects.toThrow("Unknown create outcome");
    await applyBlogExamples(persisted, fixture.adapter, persist);
    expect(fixture.all("blog.article")).toHaveLength(6);
    expect(
      new Set(fixture.all("blog.article").map((row) => row.slug)).size,
    ).toBe(6);
    await verifyBlogExamples(persisted, fixture.adapter);
  });
  it("recovers a successful delete whose response was lost without repeating unrelated writes", async () => {
    const fixture = setup();
    const manifest = await prepareBlogExamples(
      fixture.input,
      fixture.adapter,
      refs,
    );
    fixture.unknownDelete("blog.article");
    let persisted = structuredClone(manifest);
    const persist = async (state: typeof manifest) => {
      persisted = structuredClone(state);
    };
    await expect(
      applyBlogExamples(manifest, fixture.adapter, persist),
    ).rejects.toThrow("Unknown delete outcome");
    const creates = fixture.writes.filter(
      (row) => row.action === "create",
    ).length;
    await applyBlogExamples(persisted, fixture.adapter, persist);
    expect(
      fixture.writes.filter((row) => row.action === "create"),
    ).toHaveLength(creates);
    expect(
      fixture.writes.filter(
        (row) => row.action === "delete" && row.entity === "blog.article",
      ),
    ).toHaveLength(8);
  });
  it("refuses stale retirement cascades before deleting any old Article", async () => {
    const fixture = setup();
    const manifest = await prepareBlogExamples(
      fixture.input,
      fixture.adapter,
      refs,
    );
    fixture.put("social.profiles-to-blog-module-articles", {
      id: "concurrent-author",
      profileId: "another",
      blogModuleArticleId: "old-0",
    });
    await expect(
      applyBlogExamples(manifest, fixture.adapter, async () => {}),
    ).rejects.toThrow("Retirement cascades changed");
    expect(
      fixture.all("blog.article").filter((row) => row.id.startsWith("old-")),
    ).toHaveLength(8);
    expect(
      fixture.writes.some(
        (row) => row.entity === "blog.article" && row.action === "delete",
      ),
    ).toBe(false);
  });
  it("refuses altered protected descendant data before any writes", async () => {
    const fixture = setup();
    const manifest = await prepareBlogExamples(
      fixture.input,
      fixture.adapter,
      refs,
    );
    fixture.put("website-builder.feature", {
      ...fixture.get("website-builder.feature", "secret-feature"),
      title: { en: "Concurrent edit" },
    });
    await expect(
      applyBlogExamples(manifest, fixture.adapter, async () => {}),
    ).rejects.toThrow("Protected Article");
    expect(fixture.writes).toHaveLength(0);
  });
  it("refuses old Articles that would orphan Website Builder or File content", async () => {
    const fixture = setup();
    fixture.put("blog.articles-to-website-builder-module-widgets", {
      id: "old-wb",
      articleId: "old-0",
      websiteBuilderModuleWidgetId: "old-widget",
      variant: "default",
    });
    await expect(
      prepareBlogExamples(fixture.input, fixture.adapter, refs),
    ).rejects.toThrow("resolve explicitly");
    expect(fixture.writes).toHaveLength(0);
  });
  it("preserves existing role-bound public read policies, including a race after prepare", async () => {
    const fixture = setup();
    const manifest = await prepareBlogExamples(
      fixture.input,
      fixture.adapter,
      refs,
    );
    fixture.put("rbac.permission", {
      id: "permission",
      type: "HTTP",
      method: "GET",
      path: fixture.input.publicReadPaths[0],
      variant: "default",
    });
    fixture.put("rbac.roles-to-permissions", {
      id: "binding",
      permissionId: "permission",
      roleId: "role",
    });
    await expect(
      applyBlogExamples(manifest, fixture.adapter, async () => {}),
    ).rejects.toThrow("role-bound");
    await expect(
      prepareBlogExamples(fixture.input, fixture.adapter, refs),
    ).rejects.toThrow("role-bound");
    expect(fixture.writes).toHaveLength(0);
  });
  it("refuses private byte reuse as public cover and stale Category updates", async () => {
    const fixture = setup();
    fixture.input.articles[0].coverFileId = "private-file";
    await expect(
      prepareBlogExamples(fixture.input, fixture.adapter, refs),
    ).rejects.toThrow("overlaps protected File");
    fixture.input.articles[0].coverFileId = "cover-0";
    const manifest = await prepareBlogExamples(
      fixture.input,
      fixture.adapter,
      refs,
    );
    fixture.put("blog.category", {
      ...fixture.get("blog.category", "category-0"),
      adminTitle: "Concurrent edit",
    });
    await expect(
      applyBlogExamples(manifest, fixture.adapter, async () => {}),
    ).rejects.toThrow("Stale prepared record");
    expect(fixture.writes).toHaveLength(0);
  });
  it("requires an explicit maintenance window before loading any operator environment", async () => {
    await expect(
      blogExampleCli(["apply", "/tmp/not-read.json"]),
    ).rejects.toThrow("exclusive-maintenance");
  });
});
