import { describe, expect, test } from "bun:test";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { JSDOM } from "jsdom";
import { ProductMaterials } from "./ProductMaterials";
import type { IProductCatalogView } from "../products/source";
import type { IProductPageView } from "../products/pages";

function page(id: string, text: string): IProductPageView {
  return {
    id,
    title: id,
    kind: "markdown",
    layer: "startup",
    children: [],
    markdown: `# ${id}\n\n${text}`,
  };
}
function fixture(count = 2): IProductCatalogView {
  return {
    id: "startup",
    label: "startup",
    inherited: false,
    sourcePaths: [],
    products: [
      {
        id: "service",
        name: "Service",
        summary: "Own product",
        documents: [],
        sections: [
          {
            id: "articles",
            title: "Статьи",
            pages: Array.from({ length: count }, (_, index) => ({
              ...page(`topic-${index}`, `Unique task ${index}`),
              markdown: `---\naudience: Audience ${index}\nsemantic_cluster: G${index}\ngoal: Goal ${index}\n---\n# Topic ${index}\n\nUnique task ${index}`,
              children: [
                {
                  ...page(`text-${index}`, `Unique article ${index}`),
                  kind: "react",
                  markdown: undefined,
                  Component: () => <p>Preview {index}</p>,
                },
                {
                  ...page(`video-${index}`, `Video script ${index}`),
                  children: [page(`cover-${index}`, `Cover ${index}`)],
                },
              ],
            })),
          },
        ],
      },
    ],
  };
}

describe("product materials", () => {
  test("opens the selected document without an internal sidebar", () => {
    const html = renderToStaticMarkup(
      <ProductMaterials
        view={fixture(80)}
        productId="service"
        materialId="articles-topic-79"
      />,
    );
    expect(html).toContain("Unique task 79");
    expect(html).not.toContain("<nav");
    expect(html).not.toContain("Unique task 0");
    expect(html).not.toContain("text-0");
    expect(html).not.toContain("Найти статью");
  });
  test("shows article queries from its SEO source instead of an opaque cluster ID", () => {
    const view = fixture();
    const article = view.products[0].sections[0].pages[0];
    article.children.push(
      page(
        "seo",
        "| Запрос | Значение |\n| --- | --- |\n| создать магазин нейросеть | 21 |",
      ),
    );
    const render = () =>
      new JSDOM(
        renderToStaticMarkup(
          <ProductMaterials
            view={view}
            productId="service"
            materialId="articles-topic-0"
          />,
        ),
      ).window.document.querySelector("dl")!.textContent;
    expect(render()).toContain("создать магазин нейросеть");
    expect(render()).not.toContain("G0");
    article.children.at(-1)!.markdown =
      "# SEO\n\n| Query | Count |\n| --- | --- |\n| own updated query | 4 |";
    expect(render()).toContain("own updated query");
    article.children.pop();
    expect(render()).toContain("Не указаны в SEO-задании");
    expect(render()).not.toContain("G0");
  });
  test("a derivative link opens its owning article without an internal sidebar", () => {
    const html = renderToStaticMarkup(
      <ProductMaterials
        view={fixture()}
        productId="service"
        materialId="articles-cover-1"
      />,
    );
    expect(html).toContain("Cover 1");
    expect(html).not.toContain("<nav");
    expect(html).not.toContain("text-0");
  });
  test("does not substitute another product when a requested ID is missing", () => {
    const html = renderToStaticMarkup(
      <ProductMaterials view={fixture()} productId="missing" />,
    );
    expect(html).toContain("Продукт не найден");
    expect(html).not.toContain("Unique task");
  });
  test("renders live layouts and all derivatives, then replaces the entire selected article", async () => {
    const dom = new JSDOM('<div id="root"></div>', {
      url: "http://localhost/iframe.html",
    });
    const globals = {
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
    const host = dom.window.document.getElementById("root")!;
    const root = createRoot(host);
    try {
      for (const index of [0, 1]) {
        await act(async () =>
          root.render(
            <ProductMaterials
              view={fixture()}
              productId="service"
              materialId={`articles-topic-${index}`}
            />,
          ),
        );
        for (const text of [
          `Unique task ${index}`,
          `Audience ${index}`,
          `Goal ${index}`,
          `Preview ${index}`,
          `Video script ${index}`,
          `Cover ${index}`,
        ])
          expect(host.textContent).toContain(text);
        expect(host.textContent).not.toContain(`Unique task ${1 - index}`);
        expect(host.textContent).not.toContain(`Unique article ${index}`);
        expect(
          host.querySelector('[aria-label="Представление материала"]'),
        ).toBeNull();
        expect(host.querySelector("nav")).toBeNull();
        expect(
          host
            .querySelector("[data-download-base-name]")
            ?.getAttribute("data-download-base-name"),
        ).toBe(`service-articles-topic-${index}`);
        expect(
          host.querySelectorAll(
            "[data-product-header] [data-download-base-name]",
          ),
        ).toHaveLength(1);
      }
    } finally {
      await act(async () => root.unmount());
      dom.window.close();
      for (const key of Object.keys(globals)) {
        if (previous[key])
          Object.defineProperty(globalThis, key, previous[key]!);
        else Reflect.deleteProperty(globalThis, key);
      }
    }
  });
  test("combines the landing brief and preview without showing app screens or duplicate copy", () => {
    const view = fixture();
    const product = view.products[0];
    product.documents.push({
      kind: "website",
      label: "Сайт",
      content: "# Сайт\n\nAudience and CTA",
      sourcePath: "apps/studio/workspace/products/startup/service/website.md",
    });
    product.sections.push({
      id: "website",
      title: "Сайт",
      pages: [
        {
          ...page("landing", "Raw landing copy"),
          kind: "react",
          markdown: undefined,
          Component: () => <p>Live landing</p>,
        },
        page("register", "App registration screen"),
      ],
    });
    const html = renderToStaticMarkup(
      <ProductMaterials view={view} productId="service" materialId="website" />,
    );
    expect(html).toContain("Audience and CTA");
    expect(html).toContain("Live landing");
    expect(html).not.toContain("App registration screen");
    expect(html).not.toContain("Raw landing copy");
  });
});
