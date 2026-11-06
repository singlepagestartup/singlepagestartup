/** Native Storybook navigation owns product/document selection and preserves source boundaries. */
import { describe, expect, test } from "bun:test";
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
  statSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { parse, stringify } from "yaml";
import { renderToStaticMarkup } from "react-dom/server";
import { ProductCatalog } from "../../../apps/studio/workspace/utils/components/ProductCatalog";
import type { IProductCatalogView } from "../../../apps/studio/workspace/utils/products/source";
import { productStoryEntries, syncProductStories } from "./stories";

const catalog = (entries: Record<string, string>) =>
  stringify({
    schema: "singlepagestartup.product-catalog.v2",
    products: Object.entries(entries).map(([id, name]) => ({
      id,
      name,
      summary: `${name} summary`,
      product: `${id}/product.md`,
      audience: `${id}/audience.md`,
      competitors: `${id}/competitors.md`,
      semantics: `${id}/semantics.md`,
      economics: `${id}/economics.md`,
      sales: `${id}/sales.yaml`,
      sections: [
        {
          id: "content",
          title: "Content",
          pages: [
            {
              id: "guides",
              title: "Guides",
              children: [
                {
                  id: "readme",
                  title: "README",
                  source: `${id}/content/readme.md`,
                },
              ],
            },
          ],
        },
      ],
    })),
  });

describe("native product stories", () => {
  test("makes layers folders and products components with six document stories", () => {
    const entries = productStoryEntries(
      catalog({ course: "Course" }),
      catalog({ course: "Client / Course" }),
    );
    expect(entries.map(({ title }) => title)).toEqual([
      "Workspace/10 Продукты/singlepage/01 Course",
      "Workspace/10 Продукты/startup/01 Client  ·  Course",
    ]);
    expect(entries[0].documents.map(({ id }) => id)).toEqual([
      "product",
      "audience",
      "competitors",
      "semantics",
      "economics",
      "sales",
    ]);
    expect(entries[1].storyId).toBe(
      "workspace-10-products-startup-course--product",
    );
    expect(entries[0].materials).toEqual([]);
    expect(
      entries[0].documents.some(
        ({ id }) => id === "content" || id === "promotion",
      ),
    ).toBe(false);
  });

  test("generates one story per complete article in a native Articles section", () => {
    const root = mkdtempSync(path.join(tmpdir(), "sps-article-stories-"));
    try {
      const source = parse(catalog({ course: "Course" }));
      source.products[0].sections.push({
        id: "articles",
        title: "Статьи",
        pages: Array.from({ length: 80 }, (_, i) => ({
          id: `topic-${i}`,
          title: `Article ${i}`,
          source: `course/articles/topic-${i}/brief.md`,
          children: [
            {
              id: `text-${i}`,
              title: `Text ${i}`,
              source: `course/articles/topic-${i}/text.md`,
            },
          ],
        })),
      });
      for (const layer of ["singlepage", "startup"]) {
        mkdirSync(path.join(root, "products", layer), { recursive: true });
        writeFileSync(
          path.join(root, "products", layer, "catalog.yaml"),
          layer === "startup" ? stringify(source) : catalog({}),
        );
      }
      const output = path.join(root, "generated");
      syncProductStories(root, output);
      const article = readFileSync(
        path.join(output, "startup-course-50-materials-articles.stories.tsx"),
        "utf8",
      );
      expect(article).toContain(
        'title: "Workspace/50 Материалы/startup/01 Course/01 Статьи"',
      );
      expect(article).toContain("component: ProductMaterials");
      expect(article.match(/tags: \["sps-product-material"/g)).toHaveLength(80);
      expect(article).toContain('args: { materialId: "articles-topic-79" }');
      expect(article).not.toContain('materialId: "articles-text-79"');
      expect(article).not.toContain("productCatalogViews.singlepage,");
      expect(
        readdirSync(output).some((name) => name.includes("topic-79.stories")),
      ).toBe(false);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  test("keeps standalone materials shallow and article derivatives inside their story", () => {
    const source = parse(catalog({ course: "Course" }));
    source.products[0].presentation = "course/presentation/Preview.tsx";
    source.products[0].sections = [
      {
        id: "articles",
        title: "Статьи",
        pages: [
          {
            id: "topic",
            title: "Topic",
            source: "course/articles/topic/brief.md",
            children: [
              {
                id: "video",
                title: "Видео",
                source: "course/articles/topic/video.md",
                children: [
                  {
                    id: "cover",
                    title: "Обложка",
                    source: "course/articles/topic/cover.md",
                  },
                ],
              },
            ],
          },
        ],
      },
    ];
    const product = productStoryEntries(stringify(source), catalog({}))[0];
    expect(product.materialGroups[0].id).toBe("presentation");
    expect(product.materialGroups[0].items).toHaveLength(1);
    expect(product.materialGroups[1].items).toEqual([
      { id: "articles-topic", title: "Topic" },
    ]);
  });

  test("updates only changed products, removes obsolete generated stories and never rewrites catalogs", () => {
    const root = mkdtempSync(path.join(tmpdir(), "sps-native-stories-"));
    try {
      for (const layer of ["singlepage", "startup"])
        mkdirSync(path.join(root, "products", layer), { recursive: true });
      const localPath = path.join(root, "products/startup/catalog.yaml");
      writeFileSync(
        path.join(root, "products/singlepage/catalog.yaml"),
        catalog({ course: "Course" }),
      );
      writeFileSync(localPath, catalog({}));
      const output = path.join(root, "generated");
      syncProductStories(root, output);
      const file = path.join(
        output,
        "singlepage-course-10-products.stories.tsx",
      );
      for (const area of ["10-products", "50-materials"]) {
        const empty = readFileSync(
          path.join(output, `startup-${area}-empty.stories.tsx`),
          "utf8",
        );
        expect(empty).toContain("view: productCatalogViews.startup");
        expect(empty).not.toContain('"!dev"');
        expect(empty).toContain(
          area === "10-products"
            ? 'title: "Workspace/10 Продукты/startup/Каталог продуктов"'
            : 'title: "Workspace/50 Материалы/startup/Материалы продуктов"',
        );
      }
      const modified = statSync(file).mtimeMs;
      const text = readFileSync(file, "utf8");
      expect(text).toContain('documentId: "economics"');
      expect(text).not.toContain("materialId:");
      expect(readdirSync(output).some((name) => name.includes("legacy"))).toBe(
        false,
      );
      writeFileSync(localPath, catalog({ client: "Client" }));
      syncProductStories(root, output);
      expect(statSync(file).mtimeMs).toBe(modified);
      expect(readdirSync(output)).not.toContain(
        "startup-10-products-empty.stories.tsx",
      );
      expect(readdirSync(output)).not.toContain(
        "startup-50-materials-empty.stories.tsx",
      );
      expect(readdirSync(output)).toContain(
        "startup-client-10-products.stories.tsx",
      );
      writeFileSync(localPath, catalog({}));
      syncProductStories(root, output);
      expect(readdirSync(output)).not.toContain(
        "startup-client-10-products.stories.tsx",
      );
      expect(readFileSync(localPath, "utf8")).toBe(catalog({}));
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  const view: IProductCatalogView = {
    id: "singlepage",
    label: "singlepage",
    inherited: false,
    sourcePaths: [],
    products: ["course", "coaching"].map((id) => ({
      id,
      name: id,
      summary: `${id} definition`,
      sections: [],
      documents: (["product", "economics"] as const).map((kind) => ({
        kind,
        label: kind === "product" ? "Product" : "Operations & Economics",
        sourcePath: `apps/studio/workspace/products/singlepage/${id}/${kind}.md`,
        content: `# ${kind}\n\n${id} complete ${kind}`,
      })),
    })),
  };

  test("opens one complete document, puts its exports in the product header and has no nested selectors", () => {
    const html = renderToStaticMarkup(
      <ProductCatalog
        view={view}
        productId="coaching"
        documentId="economics"
      />,
    );
    expect(html).toContain("coaching complete economics");
    expect(html).toContain('data-workspace-projection="default"');
    expect(html).not.toContain("coaching complete product");
    expect(html).not.toContain("course complete");
    expect(html).not.toContain('role="tablist"');
    expect(html).not.toContain('role="tree"');
    expect(html).not.toContain('aria-label="Product documents"');
    const header = html.slice(
      html.indexOf("data-product-header"),
      html.indexOf("</header>"),
    );
    expect(header).toContain("coaching");
    expect(header).toContain(">Operations &amp; Economics</h1>");
    expect(header.indexOf("coaching")).toBeLessThan(header.indexOf("<h1"));
    expect(html).not.toContain("Нужна проверка");
    expect(html).not.toContain("coaching definition");
    expect(html).not.toContain(">Operations &amp; Economics</h2>");
    expect(header).toContain('aria-label="Скачать Markdown"');
    expect(header).toContain('aria-label="Скачать HTML"');
    expect(header).toContain('data-download-base-name="coaching-economics"');
  });

  test("preserves the plain presentation export route without document chrome", () => {
    const descriptor = Object.getOwnPropertyDescriptor(globalThis, "window");
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: { location: { search: "?document=presentation&product=course" } },
    });
    try {
      const deckView: IProductCatalogView = {
        ...view,
        products: [
          {
            ...view.products[0],
            presentation: {
              Component: () => <main data-slide-id="cover">Complete deck</main>,
              sourcePath: "course/presentation/Deck.tsx",
            },
          },
        ],
      };
      const html = renderToStaticMarkup(<ProductCatalog view={deckView} />);
      expect(html).toContain('data-slide-id="cover"');
      expect(html).not.toContain("data-product-header");
      expect(html).not.toContain("complete product");
    } finally {
      if (descriptor) Object.defineProperty(globalThis, "window", descriptor);
      else Reflect.deleteProperty(globalThis, "window");
    }
  });

  test("does not substitute another product or document when a bookmark is missing", () => {
    expect(
      renderToStaticMarkup(<ProductCatalog view={view} productId="unknown" />),
    ).toContain("Продукт не найден");
    const html = renderToStaticMarkup(
      <ProductCatalog view={view} productId="course" documentId="missing" />,
    );
    expect(html).toContain("Документ не найден");
    expect(html).not.toContain("complete product");
  });
});
