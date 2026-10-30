import { describe, expect, it } from "bun:test";
import { createHash } from "node:crypto";
import {
  applyPageSeo,
  preparePageSeo,
  rollbackPageSeo,
  verifyPageSeo,
  type IPageSeoAdapter,
  type IPageSeoInput,
} from "./page-seo";

function fixture() {
  const rows: Record<keyof IPageSeoAdapter, any[]> = {
    pages: [
      {
        id: "ru-page",
        url: "/blog",
        language: "ru",
        title: "Blog",
        description: "Description",
        variant: "default",
        indexing: "auto",
      },
      {
        id: "en-page",
        url: "/blog",
        language: "en",
        title: "Blog",
        description: "Description",
        variant: "default",
        indexing: "auto",
      },
    ],
    metadata: [
      { id: "old-meta", title: "Original editorial title", variant: "default" },
    ],
    pageLinks: [
      {
        id: "old-link",
        pageId: "ru-page",
        metadataId: "old-meta",
        orderIndex: 0,
        variant: "default",
      },
    ],
    coverLinks: [],
    files: [],
  };
  let writes = 0;
  const api = Object.fromEntries(
    Object.keys(rows).map((key) => [
      key,
      {
        find: async ({ params }: any = {}) =>
          structuredClone(
            rows[key as keyof typeof rows].slice(
              params?.offset ?? 0,
              (params?.offset ?? 0) + (params?.limit ?? 100),
            ),
          ),
        create: async ({ data }: any) => {
          writes++;
          const row = {
            ...data,
            id: `${key}-${writes}`,
            ...(key === "files"
              ? {
                  file: "/covers/generated.webp",
                  width: 1254,
                  height: 1254,
                  mimeType: "image/webp",
                }
              : {}),
          };
          rows[key as keyof typeof rows].push(row);
          return structuredClone(row);
        },
        update: async ({ id, data }: any) => {
          writes++;
          const row = rows[key as keyof typeof rows].find(
            (row) => row.id === id,
          );
          Object.assign(row, data);
          return structuredClone(row);
        },
        delete: async ({ id }: any) => {
          writes++;
          rows[key as keyof typeof rows] = rows[
            key as keyof typeof rows
          ].filter((row) => row.id !== id);
        },
      },
    ]),
  ) as unknown as IPageSeoAdapter;
  const bytes = new TextEncoder().encode("verified cover bytes");
  const input: IPageSeoInput = {
    schema: "sps.page-seo-input.v1",
    assets: {
      blog: {
        path: "blog.webp",
        sha256: createHash("sha256").update(bytes).digest("hex"),
        alt: "Editorial library",
      },
    },
    pages: ["ru", "en"].map((language) => ({
      url: "/blog",
      language,
      cover: "blog",
      page: {
        title: language === "ru" ? "Блог" : "Blog",
        description: language === "ru" ? "Статьи проекта" : "Project articles",
      },
      metadata: {
        title: "[host.pages.title]",
        description: "[host.pages.description]",
        opengraphLocale: language,
      },
    })),
  };
  return { rows, api, input, bytes, writes: () => writes };
}
describe("Page SEO publication", () => {
  it("publishes explicit links and covers for both locales while retaining previous editorial records and publication policy", async () => {
    const f = fixture();
    f.input.assets.unused = { ...f.input.assets.blog, alt: "Unused cover" };
    const manifest = await preparePageSeo(f.input, f.api);
    expect(f.writes()).toBe(0);
    const result = await applyPageSeo(
      manifest,
      f.api,
      async () => {},
      async () => f.bytes,
    );
    expect(result).toEqual({ pages: 2, metadata: 2, covers: 1 });
    expect(f.rows.metadata.find((row) => row.id === "old-meta")?.title).toBe(
      "Original editorial title",
    );
    expect(f.rows.pageLinks.some((row) => row.id === "old-link")).toBe(true);
    expect(
      f.rows.pages.every(
        (row) => row.indexing === "auto" && row.variant === "default",
      ),
    ).toBe(true);
    expect(
      new Set(manifest.operations.map((operation) => operation.metadata.id))
        .size,
    ).toBe(2);
    const count = f.writes();
    await applyPageSeo(
      manifest,
      f.api,
      async () => {},
      async () => f.bytes,
    );
    const next = await preparePageSeo(f.input, f.api);
    await applyPageSeo(
      next,
      f.api,
      async () => {},
      async () => f.bytes,
    );
    expect(f.writes()).toBe(count);
  });
  it("refuses incomplete page inventory before writes", async () => {
    const f = fixture();
    f.input.pages.pop();
    await expect(preparePageSeo(f.input, f.api)).rejects.toThrow(
      "Every saved Page",
    );
    expect(f.writes()).toBe(0);
  });

  it("forks shared Metadata before assigning page-specific cover files", async () => {
    const f = fixture();
    f.input.pages[1].metadata = f.input.pages[0].metadata;
    f.rows.metadata[0] = {
      ...f.input.pages[0].metadata,
      id: "old-meta",
      variant: "default",
    };
    f.rows.pageLinks.push({
      id: "second-old-link",
      pageId: "en-page",
      metadataId: "old-meta",
      orderIndex: 0,
      variant: "default",
    });
    const manifest = await preparePageSeo(f.input, f.api);
    expect(
      manifest.operations.every((operation) => !operation.metadata.id),
    ).toBe(true);
    await applyPageSeo(
      manifest,
      f.api,
      async () => {},
      async () => f.bytes,
    );
    expect(
      f.rows.coverLinks.every((link) => link.metadataId !== "old-meta"),
    ).toBe(true);
  });
  it("refuses changed cover bytes or unrelated Page state before publication", async () => {
    const f = fixture();
    const manifest = await preparePageSeo(f.input, f.api);
    await expect(
      applyPageSeo(
        manifest,
        f.api,
        async () => {},
        async () => new Uint8Array(),
      ),
    ).rejects.toThrow("Cover bytes changed");
    f.rows.pages[0].variant = "hidden";
    await expect(
      applyPageSeo(
        manifest,
        f.api,
        async () => {},
        async () => f.bytes,
      ),
    ).rejects.toThrow("Page changed");
    expect(f.writes()).toBe(0);
  });
  it("recovers an acknowledged-lost Metadata create without duplicating it", async () => {
    const f = fixture();
    const manifest = await preparePageSeo(f.input, f.api);
    const create = f.api.metadata.create;
    let fail = true;
    f.api.metadata.create = async (props) => {
      const result = await create(props);
      if (fail) {
        fail = false;
        throw Error("Connection lost after commit");
      }
      return result;
    };
    await expect(
      applyPageSeo(
        manifest,
        f.api,
        async () => {},
        async () => f.bytes,
      ),
    ).rejects.toThrow("Connection lost");
    await applyPageSeo(
      manifest,
      f.api,
      async () => {},
      async () => f.bytes,
    );
    expect(f.rows.metadata.length).toBe(3);
    await verifyPageSeo(manifest, f.api);
  });
  it("rolls back only its publication links and Page fields, retaining assets and existing relations", async () => {
    const f = fixture();
    const manifest = await preparePageSeo(f.input, f.api);
    await applyPageSeo(
      manifest,
      f.api,
      async () => {},
      async () => f.bytes,
    );
    await rollbackPageSeo(manifest, f.api, async () => {});
    expect(
      f.rows.pages.every(
        (row) => row.title === "Blog" && row.description === "Description",
      ),
    ).toBe(true);
    expect(f.rows.pageLinks.map((row) => row.id)).toEqual(["old-link"]);
    expect(f.rows.files).toHaveLength(1);
    expect(f.rows.metadata).toHaveLength(3);
  });
  it("preserves later Page text edits when publication only supplied Metadata", async () => {
    const f = fixture();
    for (const page of f.input.pages) delete page.page;
    const manifest = await preparePageSeo(f.input, f.api);
    await applyPageSeo(
      manifest,
      f.api,
      async () => {},
      async () => f.bytes,
    );
    f.rows.pages[0].title = "Later editorial title";
    await rollbackPageSeo(manifest, f.api, async () => {});
    expect(f.rows.pages[0].title).toBe("Later editorial title");
    expect(f.rows.pageLinks.map((row) => row.id)).toEqual(["old-link"]);
  });
});
