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
import { createRoot } from "react-dom/client";
import { act } from "react";
import { JSDOM } from "jsdom";
import { parseProductCatalog, resolveProductCatalog } from "./catalog";
import {
  resolveProductSections,
  resolveProductPreviewLink,
  type IProductPageSources,
} from "./pages";
import { ProductPages } from "../components/ProductPages";
import { WorkspacePage } from "../components/WorkspacePage";
import { productReviewPages } from "../../../../../tools/studio/workspace/review";
import { parseCodeFrameworkWebsite } from "../../products/singlepage/singlepagestartup/website/content";
import {
  parseAIChatServicePage,
  parseAIChatWebsite,
} from "../../products/singlepage/ai-chat/website/content";
import { ProductCatalog } from "../components/ProductCatalog";
import {
  canNavigateWorkspacePage,
  findWorkspacePage,
  requestedWorkspacePage,
  type IWorkspacePageView,
} from "../pages";
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
  test("passes the product link resolver to React layouts", () => {
    const html = renderToStaticMarkup(
      <WorkspacePage
        resolveLink={() => ({ href: "/?path=other-product", target: "_top" })}
        page={{
          id: "landing",
          title: "Landing",
          kind: "react",
          layer: "singlepage",
          children: [],
          Component: ({ resolveLink }) => {
            const link = resolveLink!("/");
            return (
              <a {...(typeof link === "string" ? { href: link } : link)}>
                AI Chat
              </a>
            );
          },
        }}
      />,
    );
    expect(html).toContain('href="/?path=other-product" target="_top"');
  });
  test("passes the internal destination to chat layouts", () => {
    const html = renderToStaticMarkup(
      <WorkspacePage
        navigationHref="/ai-chat/social/profiles/example#materials"
        page={{
          id: "chat",
          title: "Chat",
          kind: "react",
          layer: "singlepage",
          children: [],
          Component: ({ navigationHref }) => (
            <div data-destination={navigationHref}>Chat</div>
          ),
        }}
      />,
    );
    expect(html).toContain(
      'data-destination="/ai-chat/social/profiles/example#materials"',
    );
  });

  test("keeps account page copy and form labels in the review source", () => {
    for (const page of ["register", "login", "settings", "help", "tokens"]) {
      const markdown = readFileSync(
        new URL(
          `../../products/singlepage/ai-chat/website/${page}.md`,
          import.meta.url,
        ),
        "utf8",
      );
      const original = parseAIChatServicePage(markdown);
      const revised = markdown
        .replace(
          `## ${original.sections.hero.title}`,
          "## Revised account page.",
        )
        .replace(original.labels["back-label"], "Return to my work");
      const copy = parseAIChatServicePage(revised);
      expect(copy.sections.hero.title).toBe("Revised account page.");
      expect(copy.labels["back-label"]).toBe("Return to my work");
      expect(copy.sections.hero.paragraphs.join(" ")).not.toContain(
        "confirmation:",
      );
    }
  });

  /** BDD Scenario: AI Chat website wording has one canonical source
   * Given the AI Chat landing page supplies both review text and its React layout
   * When its project promise and workspace steps are revised in Markdown
   * Then the layout parser receives those revisions in their original sections
   */
  test("keeps AI Chat landing copy bound to its Markdown source", () => {
    const markdown = readFileSync(
      new URL(
        "../../products/singlepage/ai-chat/website/page.md",
        import.meta.url,
      ),
      "utf8",
    );
    const original = parseAIChatWebsite(markdown);
    const revised = markdown
      .replace(
        `# ${original.hero.title}`,
        "# Describe your project from existing notes.",
      )
      .replace(
        `| ${original.workflow.items[0].title}`,
        "| Bring existing material",
      )
      .replace(
        `## ${original.publish.title}`,
        "## Review the written descriptions.",
      );
    const content = parseAIChatWebsite(revised);

    expect(content.hero.title).toBe(
      "Describe your project from existing notes.",
    );
    expect(content.workflow.items[0].title).toBe("Bring existing material");
    expect(content.publish.title).toBe("Review the written descriptions.");
    expect(content.foundation.items.map(({ title }) => title)).toEqual([
      "Brief",
      "Strategy",
      "Brand",
      "Design",
      "Products",
    ]);
    expect(content.labels["navigation-foundation"]).toBeTruthy();
  });

  /** BDD Scenario: Editing page headings preserves the layout's content bindings
   * Given the authored landing page has stable section identifiers
   * When an operator revises its headline, feature and question copy
   * Then the layout parser exposes those changes in their original sections
   */
  test("keeps the actual landing bindings stable through copy revisions", () => {
    const markdown = readFileSync(
      new URL(
        "../../products/singlepage/singlepagestartup/website/page.md",
        import.meta.url,
      ),
      "utf8",
    );
    const original = parseCodeFrameworkWebsite(markdown);
    const revised = markdown
      .replace(original.hero.title, "Your next business starts here.")
      .replace(original.foundation.items[0].title, "Your customer accounts")
      .replace(original.questions.items[0].title, "How do I direct my agent?");
    const content = parseCodeFrameworkWebsite(revised);
    expect(content.hero.title).toBe("Your next business starts here.");
    expect(content.foundation.items[0].title).toBe("Your customer accounts");
    expect(content.questions.items[0].title).toBe("How do I direct my agent?");
    expect(content.journey.items).toHaveLength(3);
    expect(content.footer.links).toEqual(original.footer.links);
    expect(content.labels["copy-success"]).toContain("Request copied");
    expect(content.hero.paragraphs.join(" ")).not.toContain("confirmed:");
  });
  const pairedProduct = (
    representations: unknown = {
      text: "example/lessons/introduction.md",
      preview: "example/website/pages/Checkout.jsx",
    },
  ) => ({
    ...extensionProduct,
    sections: [
      {
        id: "website",
        title: "Website",
        pages: [
          {
            id: "site",
            title: "Site pages",
            children: [
              {
                id: "landing",
                title: "Landing",
                route: "/",
                representations,
              },
            ],
          },
        ],
      },
    ],
  });

  /** BDD Scenario: One page copy drives both review representations
   * Given a nested site page pairs Markdown with a React layout
   * When its copy is revised
   * Then text and layout receive the revision and its text remains reviewable
   */
  test("keeps a page's text and layout synchronized through one source", () => {
    const product = pairedProduct();
    const parsed = catalog("startup", product);
    for (const title of ["Original offer", "Revised offer"]) {
      const fixture = sources("startup");
      const text = `# ${title}\n\nOne customer offer.`;
      fixture.markdown["startup/example/lessons/introduction.md"] = text;
      fixture.components["startup/example/website/pages/Checkout.jsx"] = {
        default: ({ text }) => <div data-layout="true">{text}</div>,
      };
      const sections = resolveProductSections(
        parsed.products[0].sections,
        "startup",
        fixture,
      );
      const page = sections[0].pages[0].children[0];
      expect(page.route).toBe("/");
      const html = renderToStaticMarkup(
        <ProductPages
          downloadContext="Code Framework"
          pages={sections[0].pages}
        >
          {null}
        </ProductPages>,
      );
      expect(html).toContain(title);
      expect(html).toContain('role="tree"');
      expect(html).toContain('aria-level="2"');
      expect(html).toContain('aria-pressed="true"');
      expect(html).toContain(">Layout<");
      expect(html).not.toContain('data-layout="true"');
      expect(html.match(/Needs confirmation/g)).toHaveLength(1);
      expect(html.split("<article")[1]).not.toContain("Needs confirmation");
      expect(html).toContain("bg-[var(--workspace-brand-background)]");
      expect(html).toContain("<hr");
      expect(html.indexOf("data-document-toolbar")).toBeLessThan(
        html.indexOf("data-export-document"),
      );
      expect(html.slice(html.indexOf("data-export-document"))).toContain(
        `>${title}</h2>`,
      );
      expect(html).toContain('aria-label="Download Markdown"');
      expect(html).toContain(
        'data-download-base-name="code-framework-landing"',
      );
      expect(html).toContain("<span>.md</span>");
      const preview = page.representations!.preview!;
      expect(preview.text).toBe(text);
      expect(renderToStaticMarkup(<WorkspacePage page={preview} />)).toContain(
        title,
      );
    }
    expect(productReviewPages(product)).toEqual([
      {
        id: "product.example.page.website.landing",
        source: "example/lessons/introduction.md",
        owner: "website",
      },
    ]);
  });

  /** BDD Scenario: Copy may be prepared before a layout exists
   * Given only a page's text is declared
   * When it is opened or paired files are validated
   * Then text remains usable and undeclared or missing layouts never fall back
   */
  test("supports text-first work and validates both owned files", async () => {
    const parsed = catalog(
      "startup",
      pairedProduct({ text: "example/lessons/introduction.md" }),
    );
    const sections = resolveProductSections(
      parsed.products[0].sections,
      "startup",
      sources("startup"),
    );
    const html = renderToStaticMarkup(
      <ProductPages pages={sections[0].pages}>{null}</ProductPages>,
    );
    expect(html).toContain("Lesson introduction");
    expect(html).toMatch(/disabled=""[^>]*>Layout</);
    const root = new URL(
      "../../../../../tools/studio/products/fixtures/startup",
      import.meta.url,
    ).pathname;
    await validateProductSectionFiles(
      catalog("startup", pairedProduct()),
      root,
    );
    const missing = catalog(
      "startup",
      pairedProduct({
        text: "example/lessons/introduction.md",
        preview: "example/missing.tsx",
      }),
    );
    await expect(validateProductSectionFiles(missing, root)).rejects.toThrow(
      "example/missing.tsx",
    );
  });

  /** BDD Scenario: Representation ownership applies independently
   * Given missing text, an unsupported format or a cross-product path
   * When the catalog is parsed
   * Then the invalid page is rejected before rendering
   */
  test("rejects invalid paired page declarations", () => {
    for (const representations of [
      { preview: "example/page.tsx" },
      { text: "other/page.md" },
      { text: "example/page.md", preview: "other/page.tsx" },
      { text: "example/page.html" },
      { text: "example/page.md", preview: "example/image.png" },
      { text: "example/../page.md" },
    ])
      expect(() =>
        catalog("startup", pairedProduct(representations)),
      ).toThrow();
    const mixed = pairedProduct();
    Object.assign(mixed.sections[0].pages[0].children[0], {
      source: "example/website/index.html",
    });
    expect(() => catalog("startup", mixed)).toThrow("cannot mix");
  });
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
      expect(html).toContain("01 Promotion");
      expect(html).toContain('aria-label="Promotion materials"');
      expect(html).toContain('role="tablist"');
      expect(html).toContain(">Website</button>");
      expect(html).not.toContain(">01 Website<");
      expect(html).not.toContain(">Overview<");
      expect(html).not.toContain(">Presentation<");
    } finally {
      if (descriptor) Object.defineProperty(globalThis, "window", descriptor);
      else Reflect.deleteProperty(globalThis, "window");
    }
  });
  /**
   * BDD Scenario: Keep measurements and interpretation in one evidence surface.
   * Given: a product owns both Analytics and Research documents.
   * When: a legacy Research address is opened.
   * Then: Analytics is the top-level tab and its badge tabs select Research without duplicating either source.
   */
  test("groups analytics and research while preserving legacy addresses", () => {
    const descriptor = Object.getOwnPropertyDescriptor(globalThis, "window");
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {
        location: {
          search: "?section=research",
          href: "http://localhost/iframe.html?section=research",
        },
      },
    });
    try {
      const confirmation = {
        confirmed: false,
        state: "unconfirmed" as const,
        layer: "startup" as const,
      };
      const view: IProductCatalogView = {
        id: "startup",
        label: "startup",
        inherited: false,
        sourcePaths: [],
        products: [
          {
            id: "evidence",
            name: "Evidence product",
            summary: "Measurement loop",
            sections: [],
            documents: [
              {
                kind: "analytics",
                label: "05 Analytics",
                sourcePath: "evidence/analytics.md",
                content: "# Analytics\n\nObserved values.",
                confirmation,
              },
              {
                kind: "research",
                label: "02 Research",
                sourcePath: "evidence/research.md",
                content: "# Research\n\nInterpreted finding.",
                confirmation,
              },
            ],
          },
        ],
      };
      const html = renderToStaticMarkup(<ProductCatalog view={view} />);
      expect(html).toContain("Interpreted finding.");
      expect(html).toContain("01 Analytics");
      expect(html).toContain('aria-label="Analytics views"');
      expect(html).toContain('aria-selected="true"');
      expect(html).toContain(">Analytics</button>");
      expect(html).toContain(">Research</button>");
    } finally {
      if (descriptor) Object.defineProperty(globalThis, "window", descriptor);
      else Reflect.deleteProperty(globalThis, "window");
    }
  });
  /**
   * BDD Scenario: Keep delivered product material beside the product definition.
   * Given: a product has its overview and optional Product Content.
   * When: the legacy Product Content address is opened.
   * Then: Product remains the top-level tab and its badge tabs expose both sources.
   */
  test("nests product content under the product tab", () => {
    const descriptor = Object.getOwnPropertyDescriptor(globalThis, "window");
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {
        location: {
          search: "?section=content",
          href: "http://localhost/iframe.html?section=content",
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
            id: "learning",
            name: "Learning product",
            summary: "A product with delivered material",
            documents: [
              {
                kind: "product",
                label: "01 Product",
                sourcePath: "learning/product.md",
                content: "# Product\n\nProduct definition.",
                confirmation: {
                  confirmed: false,
                  state: "unconfirmed",
                  layer: "startup",
                },
              },
            ],
            sections: [
              {
                id: "content",
                title: "Product Content",
                pages: [
                  {
                    id: "lesson",
                    title: "Lesson",
                    kind: "markdown",
                    layer: "startup",
                    children: [],
                    markdown: "# Lesson\n\nDelivered material.",
                  },
                ],
              },
            ],
          },
        ],
      };
      const html = renderToStaticMarkup(<ProductCatalog view={view} />);
      expect(html).toContain("Delivered material.");
      expect(html).toContain("01 Product");
      expect(html).not.toContain("02 Product Content");
      expect(html).toContain('aria-label="Product views"');
      expect(html).toContain(">Overview</button>");
      expect(html).toContain(">Content</button>");
      expect(html).not.toContain("Defines this product&#x27;s customer");
      expect(html).toContain("bg-[var(--workspace-brand-background)]");
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
      "../../../../../tools/studio/products/fixtures/startup",
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
    expect(html).toContain("Needs confirmation");
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

describe("declared product preview navigation", () => {
  const page = (id: string, route: string): IWorkspacePageView => ({
    id,
    title: id,
    route,
    kind: "markdown",
    layer: "singlepage",
    children: [],
    representations: {
      text: {
        id,
        title: id,
        kind: "markdown",
        layer: "singlepage",
        children: [],
        markdown: `# ${id}`,
      },
      preview: {
        id,
        title: id,
        kind: "react",
        layer: "singlepage",
        children: [],
        Component: ({ navigationHref }) => (
          <div data-destination={navigationHref}>Preview {id}</div>
        ),
      },
    },
  });
  const frameworkPages = [
    page("landing", "/framework"),
    page("blog", "/blog"),
    page("article", "/blog/articles/[slug]"),
    page("article-new", "/blog/articles/new"),
    page("commerce", "/ecommerce"),
  ];
  const chatPages = [
    page("chat", "/"),
    page("tokens", "/ai-chat/rbac/subjects/tokens"),
  ];
  const view: IProductCatalogView = {
    id: "singlepage",
    label: "singlepage",
    inherited: false,
    sourcePaths: [],
    products: [
      {
        id: "singlepagestartup",
        name: "Code Framework",
        summary: "Framework",
        documents: [],
        sections: [{ id: "website", title: "Website", pages: frameworkPages }],
      },
      {
        id: "ai-chat",
        name: "AI Chat",
        summary: "Prepare a business",
        documents: [],
        sections: [{ id: "website", title: "Website", pages: chatPages }],
      },
    ],
  };
  const locationHref =
    "http://localhost:4321/iframe.html?id=workspace-40-products-singlepage--product-singlepagestartup&viewMode=story";
  const options = {
    catalog: view,
    currentProductId: "singlepagestartup",
    currentSection: "website",
    locationHref,
  };

  test("opens a cross-product route at its declared page and Layout", () => {
    const link = resolveProductPreviewLink("/?from=framework#prepare", options);
    expect(typeof link).toBe("object");
    if (typeof link === "string") throw new Error("Expected a product story");
    expect(link.target).toBe("_top");
    const url = new URL(link.href, locationHref);
    expect(url.pathname).toBe("/");
    expect(url.searchParams.get("path")).toBe(
      "/story/workspace-40-products-singlepage--product-ai-chat",
    );
    expect(url.searchParams.get("product")).toBe("ai-chat");
    expect(url.searchParams.get("section")).toBe("promotion");
    expect(url.searchParams.get("surface")).toBe("website");
    expect(url.searchParams.has("id")).toBe(false);
    const selection = requestedWorkspacePage(chatPages, {
      search: url.search,
      baseHref: locationHref,
      overview: true,
    });
    expect(selection).toEqual({
      selected: "chat",
      representation: "preview",
      navigationHref: "/?from=framework#prepare",
    });
  });

  test("keeps same-product routes local and carries dynamic destinations across products", () => {
    const article = "/blog/articles/hono-services?language=en#controllers";
    expect(resolveProductPreviewLink(article, options)).toBe(article);
    const link = resolveProductPreviewLink(article, {
      ...options,
      currentProductId: "ai-chat",
    });
    if (typeof link === "string") throw new Error("Expected a framework story");
    const url = new URL(link.href, locationHref);
    expect(url.searchParams.get("product")).toBe("singlepagestartup");
    expect(url.searchParams.get("page")).toBe("article");
    expect(url.searchParams.get("navigationHref")).toBe(article);
    expect(
      requestedWorkspacePage(frameworkPages, {
        search: url.search,
        baseHref: locationHref,
      }).navigationHref,
    ).toBe(article);
    expect(
      findWorkspacePage(frameworkPages, "/blog/articles/new", locationHref)?.id,
    ).toBe("article-new");
  });

  test("resolves another section of the same product through its review surface", () => {
    const link = resolveProductPreviewLink("/blog", {
      ...options,
      currentSection: "content",
    });
    if (typeof link === "string") throw new Error("Expected a website story");
    const url = new URL(link.href, locationHref);
    expect(url.searchParams.get("page")).toBe("blog");
    expect(url.searchParams.get("surface")).toBe("website");
    expect(url.searchParams.get("representation")).toBe("preview");
  });

  test("preserves source layers and gives the current product priority on shared routes", () => {
    const inherited = resolveProductPreviewLink("/", {
      ...options,
      catalog: { ...view, id: "default", inherited: true },
    });
    expect(typeof inherited === "object" && inherited.href).toContain(
      "workspace-40-products-singlepage--product-ai-chat",
    );
    const startup = resolveProductPreviewLink("/", {
      ...options,
      catalog: { ...view, id: "default", inherited: false },
    });
    expect(typeof startup === "object" && startup.href).toContain(
      "workspace-40-products-startup--product-ai-chat",
    );
    expect(
      resolveProductPreviewLink("/", {
        ...options,
        currentProductId: "ai-chat",
      }),
    ).toBe("/");
    expect(
      resolveProductPreviewLink("/", {
        ...options,
        catalog: {
          ...view,
          products: view.products.map((product) =>
            product.id === "singlepagestartup"
              ? {
                  ...product,
                  sections: [
                    { ...product.sections[0], pages: [page("shared", "/")] },
                  ],
                }
              : product,
          ),
        },
      }),
    ).toBe("/");
  });

  test("does not route undeclared pages, source files or external origins", () => {
    for (const href of [
      "/unpublished",
      "https://github.com/singlepagestartup/singlepagestartup",
      "//external.example/blog",
      "/workspace-products/singlepage/ai-chat/website/page.md",
      "#foundation",
    ])
      expect(resolveProductPreviewLink(href, options)).toBe(href);
    expect(
      findWorkspacePage(
        frameworkPages,
        "https://external.example/blog",
        locationHref,
      ),
    ).toBeUndefined();
  });

  test("ignores invalid page and route parameters instead of rendering a foreign destination", () => {
    const group: IWorkspacePageView = {
      id: "pages",
      title: "Pages",
      kind: "group",
      layer: "singlepage",
      children: frameworkPages,
    };
    for (const requested of ["missing", "pages"]) {
      expect(
        requestedWorkspacePage([group], {
          search: `?page=${requested}&representation=preview&navigationHref=/blog`,
          overview: true,
        }),
      ).toEqual({ selected: "overview", representation: "text" });
    }
    for (const destination of [
      "https://external.example/blog",
      "//external.example/blog",
      "/framework",
      "/missing",
    ]) {
      expect(
        requestedWorkspacePage(frameworkPages, {
          search: `?page=blog&representation=preview&navigationHref=${encodeURIComponent(destination)}`,
        }),
      ).toEqual({
        selected: "blog",
        representation: "preview",
        navigationHref: undefined,
      });
    }
    const textOnly = { ...page("text", "/text"), representations: undefined };
    expect(
      requestedWorkspacePage([textOnly], {
        search: "?page=text&representation=preview",
      }).representation,
    ).toBe("text");
  });

  test("leaves target, modified and download activations to the browser", () => {
    expect(canNavigateWorkspacePage({ button: 0 })).toBe(true);
    expect(canNavigateWorkspacePage({ button: 0, target: "_self" })).toBe(true);
    for (const activation of [
      { button: 1 },
      { button: 0, metaKey: true },
      { button: 0, ctrlKey: true },
      { button: 0, shiftKey: true },
      { button: 0, altKey: true },
      { button: 0, target: "_top" },
      { button: 0, target: "_blank" },
      { button: 0, target: "another-frame" },
      { button: 0, download: true },
    ])
      expect(canNavigateWorkspacePage(activation)).toBe(false);
  });

  test("selects Layout from a valid link, preserves query, and clears the destination on sidebar selection", async () => {
    const params = new URLSearchParams({
      page: "blog",
      representation: "preview",
      navigationHref: "/blog?category=backend",
    });
    const dom = new JSDOM("<div id='root'></div>", {
      url: `http://localhost:4321/iframe.html?${params}`,
    });
    const globals: Record<string, unknown> = {
      window: dom.window,
      document: dom.window.document,
      HTMLElement: dom.window.HTMLElement,
      IS_REACT_ACT_ENVIRONMENT: true,
    };
    const previous = Object.fromEntries(
      Object.keys(globals).map((key) => [
        key,
        Object.getOwnPropertyDescriptor(globalThis, key),
      ]),
    );
    for (const [key, value] of Object.entries(globals))
      Object.defineProperty(globalThis, key, {
        configurable: true,
        writable: true,
        value,
      });
    dom.window.HTMLElement.prototype.scrollIntoView = () => {};
    const host = dom.window.document.getElementById("root")!;
    const root = createRoot(host);
    const articleHref = "/blog/articles/hono?category=backend#example";
    let intercepted: boolean | undefined;
    let nativeCrossActivation: boolean | undefined;
    dom.window.document.addEventListener("click", (event) => {
      if ((event.target as HTMLElement).id === "cross-link")
        nativeCrossActivation = !event.defaultPrevented;
      event.preventDefault();
    });
    const pages = frameworkPages.map((entry) => ({
      ...entry,
      representations: {
        ...entry.representations!,
        preview: {
          ...entry.representations!.preview!,
          Component: ({ navigationHref }: { navigationHref?: string }) => (
            <div data-destination={navigationHref ?? "default"}>
              <a id="article-link" href={articleHref}>
                Open article
              </a>
              <a id="cross-link" href="/?from=framework#prepare">
                AI Chat
              </a>
              <a
                id="cancelled-cross-link"
                href="/?from=framework#prepare"
                onClick={(event) => event.preventDefault()}
              >
                Cancelled transition
              </a>
              <a
                id="top-link"
                href="/blog"
                target="_top"
                onClick={(event) => {
                  intercepted = event.defaultPrevented;
                  event.preventDefault();
                }}
              >
                Other story
              </a>
            </div>
          ),
        },
      },
    }));
    try {
      await act(async () =>
        root.render(
          <ProductPages
            pages={pages}
            overview
            resolveLink={(href) => resolveProductPreviewLink(href, options)}
          >
            {null}
          </ProductPages>,
        ),
      );
      expect(
        host
          .querySelector("[data-destination]")
          ?.getAttribute("data-destination"),
      ).toBe("/blog?category=backend");
      expect(
        [...host.querySelectorAll("button")]
          .find((button) => button.textContent === "Layout")
          ?.getAttribute("aria-pressed"),
      ).toBe("true");
      const crossLink = host.querySelector("#cross-link") as HTMLAnchorElement;
      await act(async () => crossLink.click());
      const crossDestination = new URL(crossLink.href);
      expect(crossLink.target).toBe("_top");
      expect(crossDestination.searchParams.get("product")).toBe("ai-chat");
      expect(crossDestination.searchParams.get("navigationHref")).toBe(
        "/?from=framework#prepare",
      );
      expect(nativeCrossActivation).toBe(true);
      expect(
        host
          .querySelector("[data-destination]")
          ?.getAttribute("data-destination"),
      ).toBe("/blog?category=backend");
      const cancelled = host.querySelector(
        "#cancelled-cross-link",
      ) as HTMLAnchorElement;
      await act(async () => cancelled.click());
      expect(cancelled.getAttribute("href")).toBe("/?from=framework#prepare");
      expect(cancelled.getAttribute("target")).toBeNull();
      await act(async () =>
        (host.querySelector("#article-link") as HTMLAnchorElement).click(),
      );
      expect(
        host
          .querySelector("[data-destination]")
          ?.getAttribute("data-destination"),
      ).toBe(articleHref);
      expect(
        host
          .querySelector('[data-page-id="article"]')
          ?.getAttribute("aria-selected"),
      ).toBe("true");
      await act(async () =>
        (host.querySelector("#top-link") as HTMLAnchorElement).click(),
      );
      expect(intercepted).toBe(false);
      expect(
        host
          .querySelector("[data-destination]")
          ?.getAttribute("data-destination"),
      ).toBe(articleHref);
      await act(async () =>
        (
          host.querySelector('[data-page-id="blog"]') as HTMLButtonElement
        ).click(),
      );
      expect(
        host
          .querySelector("[data-destination]")
          ?.getAttribute("data-destination"),
      ).toBe("default");
      await act(async () =>
        (host.querySelector("#article-link") as HTMLAnchorElement).click(),
      );
      await act(async () =>
        [...host.querySelectorAll("button")]
          .find((button) => button.textContent === "Overview")!
          .click(),
      );
      expect(host.querySelector("[data-destination]")).toBeNull();
      await act(async () =>
        (
          host.querySelector('[data-page-id="blog"]') as HTMLButtonElement
        ).click(),
      );
      expect(
        host
          .querySelector("[data-destination]")
          ?.getAttribute("data-destination"),
      ).toBe("default");
    } finally {
      await act(async () => root.unmount());
      for (const key of Object.keys(globals)) {
        if (previous[key])
          Object.defineProperty(globalThis, key, previous[key]!);
        else Reflect.deleteProperty(globalThis, key);
      }
      dom.window.close();
    }
  });
});
