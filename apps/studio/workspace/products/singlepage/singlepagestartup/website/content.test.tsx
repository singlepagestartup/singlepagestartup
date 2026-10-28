import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { parseCodeFrameworkWebsite } from "./content";
import { SiteShell } from "./Site";
import ModulesPage from "./Modules";
import Tokens from "./Tokens";
import { parseTokenPage, tokenCredit } from "./Tokens/content";
import {
  filterModules,
  parseModules,
  parseModulesPage,
  readModuleSlug,
} from "./Modules/content";

const landing = readFileSync(new URL("./page.md", import.meta.url), "utf8");
const modules = readFileSync(
  new URL("./Modules/page.md", import.meta.url),
  "utf8",
);

describe("editable Framework website copy", () => {
  test("renders authored navigation, footer prose and changed footer URLs", () => {
    const authored = parseCodeFrameworkWebsite(landing);
    const blogLink = authored.footer.links.find(
      ({ href }) => href === "/blog",
    )!;
    const edited = landing
      .replace(/(\| navigation-chat\s*\|)[^|]+/, "$1 Prepare the brief ")
      .replace(
        authored.footer.paragraphs[0],
        "Bring your reviewed project material.",
      )
      .replace(
        `[${blogLink.text}](${blogLink.href})`,
        "[Engineering journal](/journal)",
      );
    const html = renderToStaticMarkup(
      <SiteShell content={parseCodeFrameworkWebsite(edited)}>
        <main>Example page</main>
      </SiteShell>,
    );
    expect(html).toContain("Prepare the brief");
    expect(html).toContain("Bring your reviewed project material.");
    expect(html).toContain('href="/journal"');
    expect(html).toContain("Engineering journal");
  });

  test("module Layout reflects its paired introduction and composition copy", () => {
    const edited = modules
      .replace(
        parseModulesPage(modules).introduction.title,
        "Choose the parts for this project.",
      )
      .replace(
        parseModulesPage(modules).composition.title,
        "Trace the owning module.",
      )
      .replace(
        parseModulesPage(modules).preparation.title,
        "Prepare the customer task.",
      );
    const html = renderToStaticMarkup(<ModulesPage text={edited} />);
    expect(html).toContain("Choose the parts for this project.");
    expect(html).toContain("Trace the owning module.");
    expect(html).toContain("Prepare the customer task.");
    expect(parseModules(edited)).toHaveLength(15);
    expect(parseModules(edited).every((item) => item.group)).toBe(true);
  });

  test("malformed module slugs cannot select the sidebar default guide", () => {
    expect(readModuleSlug(undefined)).toBeUndefined();
    expect(readModuleSlug("/framework/modules/rbac?tab=guide")).toBe("rbac");
    expect(readModuleSlug("/framework/modules/%E0%A4%A")).toBe(
      "invalid-module-route",
    );
  });

  test("Social guide renders its paired editable article and example copy", () => {
    const edited = modules
      .replace(
        parseModulesPage(modules).social.hero.title,
        "Social для моей школы",
      )
      .replace("Клуб создателей", "Сообщество выпускников")
      .replaceAll("Как проверить первый экран", "Как проверить страницу школы")
      .replace("Школа мастер-классов", "Школа выпускников")
      .replace(
        "Готовлю страницу мастер-классов. Что показать посетителю в первую очередь?",
        "Что показать на странице школы?",
      );
    const html = renderToStaticMarkup(
      <ModulesPage
        text={edited}
        navigationHref="/framework/modules/social"
        resolveLink={(href) =>
          href === "/ai-chat/rbac/subjects/authentication/registration"
            ? "/preview/register"
            : href
        }
      />,
    );
    expect(html).toContain("Social для моей школы");
    expect(html).toContain("Сообщество выпускников");
    expect(html).toContain("Что показать на странице школы?");
    expect(html).toContain("Как проверить страницу школы");
    expect(html).toContain("Школа выпускников");
    expect(html).not.toContain("Попробуйте спросить");
    expect(html).toContain('href="/preview/register"');
    expect(html).toContain("Сообщения остаются в этом макете");
  });

  test("the Social article does not replace other module guides or unknown routes", () => {
    const billing = renderToStaticMarkup(
      <ModulesPage
        text={modules}
        navigationHref="/framework/modules/billing"
      />,
    );
    expect(billing).toContain(
      parseModulesPage(modules).guides.billing.article.title,
    );
    expect(billing).not.toContain('id="social-guide"');
    const unknown = renderToStaticMarkup(
      <ModulesPage
        text={modules}
        navigationHref="/framework/modules/not-a-module"
      />,
    );
    expect(unknown).toContain("Модуль не найден");
    expect(unknown).not.toContain('id="social-guide"');
  });
});

describe("business module discovery", () => {
  const catalog = parseModules(modules);
  const copy = parseModulesPage(modules);

  test("search combines localized tasks, technical names and selected business group", () => {
    expect(
      filterModules(catalog, "", "  FILE storage ").map((item) => item.id),
    ).toEqual(["file-storage"]);
    expect(filterModules(catalog, "", "Rbac").map((item) => item.id)).toEqual([
      "rbac",
    ]);
    expect(
      filterModules(catalog, "", "прием оплаты").map((item) => item.id),
    ).toEqual(["billing"]);
    expect(
      filterModules(catalog, "Сайт и контент", "файлы").map((item) => item.id),
    ).toEqual(["file-storage"]);
    expect(filterModules(catalog, "Продажи и клиенты", "storage")).toEqual([]);
    expect(filterModules(catalog, "", "no-such-module")).toEqual([]);
    expect(filterModules(catalog, "", " ")).toHaveLength(15);
  });

  test("every catalogue destination has a substantive guide and valid related destinations", () => {
    for (const module of catalog) {
      const html = renderToStaticMarkup(
        <ModulesPage
          text={modules}
          navigationHref={`/framework/modules/${module.id}`}
          resolveLink={(href) =>
            href.startsWith("/ai-chat/") ? "/preview/register" : href
          }
        />,
      );
      expect(html).toContain('href="/preview/register"');
      expect(html).not.toContain("undefined");
      expect(html).not.toContain(">Code Framework</a>");
      if (module.id === "social") continue;
      const guide = copy.guides[module.id];
      expect(html).toContain(guide.article.title);
      expect(guide.article.paragraphs).toHaveLength(2);
      expect(guide.article.items.length).toBeGreaterThanOrEqual(2);
      expect(guide.scenes.length).toBeGreaterThanOrEqual(2);
      expect(new Set(guide.scenes.map((scene) => scene.label)).size).toBe(
        guide.scenes.length,
      );
      expect(
        guide.scenes.every(
          (scene) => scene.rows.length > 0 && scene.description,
        ),
      ).toBe(true);
      expect(guide.task.paragraphs[0]).toBeTruthy();
      expect(guide.technical.paragraphs[0]).toBeTruthy();
      for (const related of guide.related.items)
        expect(
          catalog.some(
            (entry) => entry.id === related.title && entry.id !== module.id,
          ),
        ).toBe(true);
    }
  });

  test("guide examples and tasks render from edited Markdown", () => {
    const edited = modules
      .replace(copy.guides.rbac.scenes[0].title, "Каталог моей школы")
      .replace(
        copy.guides.rbac.task.paragraphs[0],
        "Нужен кабинет для участников клуба.",
      );
    const html = renderToStaticMarkup(
      <ModulesPage text={edited} navigationHref="/framework/modules/rbac" />,
    );
    expect(html).toContain("Каталог моей школы");
    expect(html).toContain("Нужен кабинет для участников клуба.");
  });
});

describe("token credit display", () => {
  const tokens = readFileSync(
    new URL("./Tokens/page.md", import.meta.url),
    "utf8",
  );
  test("rounds up and down mathematically without changing the package rates", () => {
    const content = parseTokenPage(tokens);
    expect(content.topups.packages.map(tokenCredit)).toEqual([
      769, 2308, 3846, 7692, 23077,
    ]);
    expect(content.topups.packages.every((pack) => pack.rate === 0.13)).toBe(
      true,
    );
    expect(tokenCredit({ amount: 5, rate: 2 })).toBe(3);
    expect(tokenCredit({ amount: 4.9, rate: 2 })).toBe(2);
  });
  test("package cards and selected summary show integer credits", () => {
    const html = renderToStaticMarkup(<Tokens text={tokens} />);
    for (const value of [769, 2308, 3846, 7692, 23077].map((value) =>
      new Intl.NumberFormat("ru-RU").format(value),
    ))
      expect(html).toContain(value);
    expect(html).not.toContain("769.230");
    expect(html).not.toContain("six decimal places");
  });
});
