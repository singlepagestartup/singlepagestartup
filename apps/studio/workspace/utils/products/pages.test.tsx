/**
 * BDD Suite: Product-owned extensible pages
 * Given products declare nested pages in their own source layer
 * When catalogs and page sources resolve
 * Then every page stays with its product and startup replaces the complete base
 */
import { describe, expect, test } from "bun:test";
import { stringify } from "yaml";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { parseProductCatalog, resolveProductCatalog } from "./catalog";
import { resolveProductSections, type IProductPageSources } from "./pages";
import { ProductPages } from "../components/ProductPages";
import { ProductCatalog } from "../components/ProductCatalog";
import type { IProductCatalogView } from "./source";
import { extensionProduct } from "../../../../../tools/studio/products/fixtures/catalog";
import { validateProductSectionFiles } from "../../../../../tools/studio/products/validate";

function catalog(
  layer: "startup" | "singlepage",
  product: unknown = extensionProduct,
) {
  return parseProductCatalog(
    stringify({
      schema: "singlepagestartup.product-catalog.v1",
      products: [product],
    }),
    layer,
  );
}
function sources(layer: "startup" | "singlepage"): IProductPageSources {
  return {
    components: {
      [`${layer}/example/website/pages/Checkout.jsx`]: {
        default: () => <div>Checkout</div>,
      },
      [`${layer}/example/presentation/Deck.tsx`]: {
        default: () => <div>Deck</div>,
      },
    },
    markdown: {
      [`${layer}/example/lessons/introduction.md`]: readFileSync(
        new URL(
          "../../../../../tools/studio/products/fixtures/startup/example/lessons/introduction.md",
          import.meta.url,
        ),
        "utf8",
      ),
    },
    files: new Set([
      `${layer}/example/website/index.html`,
      `${layer}/example/website/campaign.svg`,
    ]),
  };
}

describe("product pages", () => {
  /**
   * BDD Scenario: Show an extension before its core material is prepared.
   * Given: an initial product has a Website extension but no Website document.
   * When: the reader opens the Website section.
   * Then: its real page opens immediately without an empty Overview or deck tab.
   */
  test("opens declared material pages without requiring empty core documents", () => {
    const descriptor = Object.getOwnPropertyDescriptor(globalThis, "window");
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {
        location: {
          search: "?section=website",
          href: "http://localhost/iframe.html?section=website",
        },
      },
    });
    try {
      const view: IProductCatalogView = {
        id: "startup",
        label: "startup",
        inherited: false,
        sourcePaths: [],
        products: [
          {
            id: "early",
            name: "Early product",
            summary: "Client intake",
            documents: [],
            sections: [
              {
                id: "website",
                title: "Website",
                pages: [
                  {
                    id: "landing",
                    title: "Landing",
                    kind: "markdown",
                    layer: "startup",
                    children: [],
                    markdown: "# Landing\n\nActual visitor page.",
                  },
                ],
              },
            ],
          },
        ],
      };
      const html = renderToStaticMarkup(<ProductCatalog view={view} />);
      expect(html).toContain("Actual visitor page.");
      expect(html).not.toContain(">Overview<");
      expect(html).not.toContain(">Presentation<");
    } finally {
      if (descriptor) Object.defineProperty(globalThis, "window", descriptor);
      else Reflect.deleteProperty(globalThis, "window");
    }
  });
  /** BDD Scenario: Agent validation uses the catalog's own directory
   * Given a complete nested source tree
   * When the filesystem validator checks it and then a missing layer root
   * Then valid pages pass and missing pages fail without source fallback
   */
  test("validates nested files from the selected catalog directory", async () => {
    const root = new URL(
      "../../../../../tools/studio/products/fixtures/startup/",
      import.meta.url,
    ).pathname;
    await validateProductSectionFiles(catalog("startup"), root);
    await expect(
      validateProductSectionFiles(catalog("startup"), root + "missing/"),
    ).rejects.toThrow("Missing product page: startup/");
  });
  /** BDD Scenario: Mixed nested sources
   * Given website pages, a campaign image, and nested lessons
   * When the declared section tree resolves
   * Then JSX, HTML, image, Markdown, and TSX pages retain their hierarchy
   */
  test("resolves mixed formats and nested groups", () => {
    const sections = resolveProductSections(
      catalog("startup").products[0].sections,
      "startup",
      sources("startup"),
    );
    expect(sections[0].pages.map((p) => p.kind)).toEqual(["html", "react"]);
    expect(sections[1].pages[0].children[0].kind).toBe("image");
    const lessonPages = sections[2].pages[0].children[0].children;
    expect(lessonPages.map((p) => p.kind)).toEqual(["markdown", "react"]);
    expect(lessonPages[1].export).toBe("pdf");
    const html = renderToStaticMarkup(
      <ProductPages pages={sections[2].pages}>{null}</ProductPages>,
    );
    expect(html).toContain("Lesson introduction");
    expect(html).toContain(
      "/workspace-products/startup/example/website/campaign.svg",
    );
    expect(html).toContain("Not confirmed by user");
  });

  /** BDD Scenario: Atomic section inheritance
   * Given a startup product replaces an identically named base product
   * When default resolves the catalog and pages
   * Then base-only sections and files are never used as fallback
   */
  test("replaces all base sections and rejects missing startup files", () => {
    const base = catalog("singlepage");
    const local = catalog("startup", {
      ...extensionProduct,
      sections: [extensionProduct.sections[0]],
    });
    const selected = resolveProductCatalog(base, local).catalog;
    expect(selected.products[0].sections.map((s) => s.id)).toEqual(["website"]);
    expect(() =>
      resolveProductSections(
        selected.products[0].sections,
        selected.layer,
        sources("singlepage"),
      ),
    ).toThrow("Missing product page: startup/");
    const resolved = resolveProductSections(
      selected.products[0].sections,
      selected.layer,
      sources("startup"),
    );
    expect(resolved[0].pages[0].url).toBe(
      "/workspace-products/startup/example/website/index.html",
    );
  });

  /** BDD Scenario: Empty startup inherits the complete tree
   * Given only the base has extra sections
   * When startup has no products
   * Then page paths remain in singlepage
   */
  test("inherits the entire base tree through an empty startup catalog", () => {
    const selected = resolveProductCatalog(
      catalog("singlepage"),
      parseProductCatalog(
        "schema: singlepagestartup.product-catalog.v1\nproducts: []",
        "startup",
      ),
    ).catalog;
    const resolved = resolveProductSections(
      selected.products[0].sections,
      selected.layer,
      sources("singlepage"),
    );
    expect(resolved).toHaveLength(3);
    expect(resolved[0].pages[0].url).toContain("/singlepage/example/");
  });

  /** BDD Scenario: Reject invalid page ownership
   * Given a page escapes its product or repeats a navigation identity
   * When its catalog is read
   * Then the invalid declaration fails before rendering
   */
  test("rejects cross-product paths, duplicate IDs, and empty groups", () => {
    for (const source of [
      "other/index.html",
      "example/../other.html",
      "example/%2e%2e/other.html",
    ]) {
      expect(() =>
        catalog("startup", {
          ...extensionProduct,
          sections: [
            {
              id: "website",
              title: "Website",
              pages: [{ id: "invalid", title: "Invalid", source }],
            },
          ],
        }),
      ).toThrow();
    }
    const raw = JSON.parse(JSON.stringify(extensionProduct));
    raw.sections[0].pages.push(raw.sections[0].pages[0]);
    expect(() => catalog("startup", raw)).toThrow("repeated");
    raw.sections[0].pages = [{ id: "empty", title: "Empty" }];
    expect(() => catalog("startup", raw)).toThrow("source or children");
  });

  /** BDD Scenario: Missing declared component
   * Given a JSX source lacks a default page export
   * When the page tree resolves
   * Then it reports the owning source instead of using a base component
   */
  test("fails when a declared component has no default export", () => {
    const fixture = sources("startup");
    fixture.components["startup/example/website/pages/Checkout.jsx"] = {};
    expect(() =>
      resolveProductSections(
        catalog("startup").products[0].sections,
        "startup",
        fixture,
      ),
    ).toThrow("Missing React page default export");
  });
});
