import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { resolveProductSections, productPageSearchQueries } from "./pages";
import { findWorkspacePage, canNavigateWorkspacePage } from "../pages";
import { WorkspacePage } from "../components/WorkspacePage";
const sections = [
  {
    id: "website",
    title: "Сайт",
    pages: [
      {
        id: "landing",
        title: "Страница",
        source: "service/Landing.tsx",
        route: "/",
        children: [],
      },
      {
        id: "account",
        title: "Аккаунт",
        source: "service/account.md",
        route: "/account/[id]",
        children: [],
      },
    ],
  },
];
const sources = {
  components: {
    "startup/service/Landing.tsx": {
      default: () => <main>Owned landing layout</main>,
    },
  },
  markdown: { "startup/service/account.md": "# Account\n\nOwn account" },
  files: new Set<string>(),
};
describe("source-owned product pages", () => {
  test("renders the final artifact without paired Markdown", () => {
    const page = resolveProductSections(sections, "startup", sources)[0]
      .pages[0];
    expect(page.kind).toBe("react");
    expect(page.markdown).toBeUndefined();
    expect(renderToStaticMarkup(<WorkspacePage page={page} />)).toContain(
      "Owned landing layout",
    );
  });
  test("never substitutes framework content for a missing startup artifact", () => {
    expect(() =>
      resolveProductSections(sections, "singlepage", sources),
    ).toThrow("Missing React page");
  });
  test("routes ordinary clicks to declared pages and keeps external or modified navigation", () => {
    const pages = resolveProductSections(sections, "startup", sources)[0].pages;
    expect(
      findWorkspacePage(pages, "/account/123", "http://localhost/")?.id,
    ).toBe("account");
    expect(
      findWorkspacePage(
        pages,
        "https://other.test/account/123",
        "http://localhost/",
      ),
    ).toBeUndefined();
    expect(canNavigateWorkspacePage({ button: 0 })).toBe(true);
    expect(canNavigateWorkspacePage({ button: 0, metaKey: true })).toBe(false);
    expect(canNavigateWorkspacePage({ button: 0, download: true })).toBe(false);
  });
});

test("material queries come from query columns, preserving phrases and ignoring code examples", () => {
  const page = resolveProductSections(sections, "startup", sources)[0].pages[0];
  page.children = [
    {
      ...page,
      id: "seo",
      kind: "markdown",
      children: [],
      markdown: [
        "# SEO",
        "| Значение | Запрос |",
        "| --- | --- |",
        "| 21 | `создать магазин нейросеть` |",
        "| 126 | [интернет магазин нейросеть](https://example.test) |",
        "| 21 | создать магазин нейросеть |",
        "",
        "```md",
        "| Query |",
        "| --- |",
        "| hidden example |",
        "```",
      ].join("\n"),
    },
  ];
  expect(productPageSearchQueries(page)).toEqual([
    "создать магазин нейросеть",
    "интернет магазин нейросеть",
  ]);
});
