import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { existsSync } from "node:fs";
import path from "node:path";
import { Component as Page } from "../..";
import { frameworkModules, filterModules } from "./Modules/content";
import { articles, categories, blogHeadings } from "./Blog/content";
import { resolveFrameworkLink } from "./navigation";

const render = (variant: React.ComponentProps<typeof Page>) =>
  renderToStaticMarkup(<Page {...variant} />);

describe("Module-owned Framework pages", () => {
  test("the public landing renders the current Russian sections and owned images", () => {
    const html = render({ variant: "framework" });
    for (const text of [
      "Создайте свой продукт",
      "15 модулей",
      "Ваш бизнес в цифровом виде",
      "3. Обновите опубликованный проект",
      "используя open-source",
    ])
      expect(html).toContain(text);
    for (const id of [
      "cf-main",
      "cf-foundation",
      "cf-modules",
      "cf-start",
      "cf-chat",
      "cf-handoff-title",
      "cf-questions-title",
    ])
      expect(html).toContain(`id="${id}"`);
    expect(html).not.toContain("workspace-assets");
    expect(html).not.toContain("workspace-brand");
    expect(html).not.toContain("Turn your business brief");
    for (const [, src] of html.matchAll(
      /(?:src|href)="(\/module-assets\/[^"?]+)"/g,
    ))
      expect(
        existsSync(
          path.resolve(
            "apps/studio/runtime/assets",
            src.slice("/module-assets/".length),
          ),
        ),
      ).toBe(true);
  });
  test("landing sections use owning Widgets and repeated records use model entries", () => {
    const html = render({ variant: "framework" });
    expect(html.match(/data-module="blog" data-model="widget"/g)).toHaveLength(
      2,
    );
    expect(html.match(/data-module="blog" data-model="article"/g)).toHaveLength(
      11,
    );
    expect(html.match(/data-variant="selectable"/g)).toHaveLength(4);
    expect(html.match(/data-variant="step"/g)).toHaveLength(3);
    expect(html.match(/data-variant="dropdown"/g)).toHaveLength(16);
    expect(html).toContain('data-variant="preview-scroll"');
    expect(html).toContain("framework-example-previews/contact-hd.jpg");
    expect(html).not.toContain("sps-demo-study-format");
    expect(html).not.toContain("<form");
  });
  test("business tasks and technical names find the same catalogue destinations", () => {
    expect(frameworkModules).toHaveLength(15);
    expect(
      filterModules(frameworkModules, "", "файлы").map((item) => item.id),
    ).toEqual(["file-storage"]);
    expect(
      filterModules(frameworkModules, "", "RBAC").map((item) => item.id),
    ).toEqual(["rbac"]);
    const html = render({ variant: "framework-module-find" });
    expect(html).toContain("Что нужно вашему проекту?");
    for (const module of frameworkModules)
      expect(html).toContain(encodeURIComponent(`moduleSlug:${module.id}`));
  });
  test("every module opens its detailed guide through the public Page entry", () => {
    for (const module of frameworkModules) {
      const html = render({
        variant: "framework-module-slug",
        moduleSlug: module.id,
      });
      expect(html).toContain('lang="ru"');
      expect(html).not.toContain("Module not found");
      expect(html.match(/<h[12][ >]/g)!.length).toBeGreaterThan(4);
    }
    expect(
      render({ variant: "framework-module-slug", moduleSlug: "not-a-module" }),
    ).toContain("Модуль не найден");
  });
  test("categories and six Russian articles preserve their distinct destinations", () => {
    const index = render({ variant: "blog-module-article-find" });
    expect(index).toContain("Закреплённые категории");
    expect(articles).toHaveLength(6);
    for (const category of categories) {
      expect(
        articles.filter((article) => article.category === category.slug),
      ).toHaveLength(2);
      expect(
        render({
          variant: "blog-module-category-slug",
          categorySlug: category.slug,
        }),
      ).toContain(category.title);
    }
    for (const article of articles) {
      const html = render({
        variant: "blog-module-article-slug",
        articleSlug: article.slug,
      });
      expect(html).toContain(article.title);
      expect(html).toContain("Исходный код");
      expect(html).toContain("Ваш комментарий");
      expect(article.body.length).toBeGreaterThan(2000);
      expect(article.body).not.toContain("## Source code");
      const headings = blogHeadings(article.body);
      expect(new Set(headings.map((item) => item.id)).size).toBe(
        headings.length,
      );
      expect(headings.every((item) => item.id !== "guide-")).toBe(true);
    }
  });
  test("route links select their Module story and exact slug", () => {
    const module = resolveFrameworkLink("/framework/modules/file-storage");
    const article = resolveFrameworkLink(`/blog/articles/${articles[1].slug}`);
    expect(typeof module).toBe("object");
    if (typeof module !== "string")
      expect(
        new URL(module.href, "http://localhost").searchParams.get("args"),
      ).toBe("moduleSlug:file-storage");
    if (typeof article !== "string")
      expect(
        new URL(article.href, "http://localhost").searchParams.get("args"),
      ).toBe(`articleSlug:${articles[1].slug}`);
    expect(resolveFrameworkLink("#cf-modules")).toBe("#cf-modules");
    expect(
      resolveFrameworkLink(
        "https://github.com/singlepagestartup/singlepagestartup",
      ),
    ).toBe("https://github.com/singlepagestartup/singlepagestartup");
  });
  test("the Russian token page keeps whole estimates and current prices", () => {
    const html = render({ variant: "ecommerce-module-token-find" });
    expect(html).toContain("0,13");
    expect(html).toContain(Math.round(300 / 0.13).toLocaleString("ru-RU"));
    expect(html).not.toContain("769.230769");
  });
  test("AI Chat landing embeds its domain workspace rather than the retired walkthrough", () => {
    const html = render({ variant: "ai-chat" });
    expect(html).toContain(
      'data-variant="subject-me-social-module-profile-id-chat-id-thread-id-ai-chat"',
    );
    expect(html).toContain("Продукты.md");
    expect(html).toContain("Рабочий контекст");
    expect(html).not.toContain('data-variant="id-preview-ai-chat"');
    expect(html).not.toContain("Restart walkthrough");
    expect(html.match(/<main[ >]/g)).toHaveLength(1);
  });
});
