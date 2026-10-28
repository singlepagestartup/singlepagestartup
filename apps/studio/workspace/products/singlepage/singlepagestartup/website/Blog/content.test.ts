import { describe, expect, test } from "bun:test";
import {
  articles,
  blogHeadings,
  blogRouteSlug,
  categories,
  formatBlogDate,
  parseBlogArticle,
  parseBlogDate,
  parseBlogDocument,
  selectBlogArticles,
} from "./content";

describe("Code Framework journal content and routes", () => {
  test("only sidebar selections use a default article or category", () => {
    expect(blogRouteSlug(undefined, "articles", articles[0].slug)).toBe(
      articles[0].slug,
    );
    expect(
      blogRouteSlug("/blog/articles/missing", "articles", articles[0].slug),
    ).toBe("missing");
    expect(
      blogRouteSlug(
        "/blog/categories/backend?view=preview#top",
        "categories",
        "frontend",
      ),
    ).toBe("backend");
    for (const href of [
      "https://other.example/blog/articles/nextjs",
      "/blog/articles/%2Ffrontend",
      "/blog/articles/%E0%A4%A",
      "/blog/articles/../frontend",
      "/blog/categories/frontend",
      "/blog/articles/nextjs/extra",
    ]) {
      expect(blogRouteSlug(href, "articles", articles[0].slug)).toBeUndefined();
    }
  });

  test("a category and every search term restrict the result together", () => {
    expect(
      selectBlogArticles(articles, "backend", "Hono").length,
    ).toBeGreaterThan(0);
    expect(
      selectBlogArticles(articles, "backend", "Hono").every(
        (article) => article.category === "backend",
      ),
    ).toBe(true);
    expect(
      selectBlogArticles(articles, "all", "  Next.js   boundary ").length,
    ).toBeGreaterThan(0);
    expect(
      selectBlogArticles(articles, "all", "does-not-exist-in-the-journal"),
    ).toEqual([]);
  });

  test("the source collection contains two complete guides per category", () => {
    expect(new Set(articles.map((article) => article.slug)).size).toBe(6);
    for (const category of categories) {
      const grouped = articles.filter(
        (article) => article.category === category.slug,
      );
      expect(grouped).toHaveLength(2);
      for (const article of grouped) {
        expect(parseBlogDate(article.createdAt)).toBeDefined();
        expect(article.body.split(/\s+/).length).toBeGreaterThan(600);
        expect(article.body).toMatch(/(?:~~~|```)(?:tsx?|sh)/);
        expect(article.body).toContain(
          "https://github.com/singlepagestartup/singlepagestartup/",
        );
      }
    }
  });

  test("quoted metadata preserves colons and heading links exclude code", () => {
    const parsed = parseBlogDocument(
      '---\ntitle: "Next.js: readers"\n---\n\nA saved article.',
    );
    expect(parsed.meta.title).toBe("Next.js: readers");
    expect(parsed.body).toBe("A saved article.");
    expect(
      blogHeadings(
        "## Read the record\n\n~~~ts\n## not a heading\n~~~\n\n## Check access",
      ),
    ).toEqual([
      { title: "Read the record", id: "guide-read-the-record" },
      { title: "Check access", id: "guide-check-access" },
    ]);
  });

  test("creation dates keep authored calendar values and reject impossible dates", () => {
    expect(parseBlogDate("2024-02-29")).toBe("2024-02-29");
    expect(formatBlogDate("2026-10-23")).toBe("Oct 23, 2026");
    for (const invalid of [
      undefined,
      "",
      "2026-02-29",
      "2026-04-31",
      "2026-13-01",
      "2026-10-23T12:00:00Z",
      "not-a-date",
    ]) {
      expect(parseBlogDate(invalid)).toBeUndefined();
      expect(formatBlogDate(invalid)).toBeUndefined();
    }
    const metadata =
      '---\nslug: "date-example"\ncategory: "frontend"\ntitle: "Example"\nexcerpt: "A guide"\ncover: "next-server-client"\ncoverAlt: "Editorial cover"\nauthor: "Editorial"\nauthorRole: "Architecture"\ncreatedAt: "2026-10-23"\n---\n\nBody.';
    expect(parseBlogArticle(metadata).createdAt).toBe("2026-10-23");
    expect(
      parseBlogArticle(metadata.replace("2026-10-23", "2026-02-29")).createdAt,
    ).toBeUndefined();
  });
});
