import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { parseCodeFrameworkWebsite } from "./content";
import { SiteShell } from "./Site";
import ModulesPage from "./Modules";
import {
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
        "Connect the capability to its presentation.",
        "Trace the owning module.",
      )
      .replace(
        "Start with the business decision.",
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
        "Social: люди, общение и ИИ в вашем продукте",
        "Social для моей школы",
      )
      .replace("Клуб создателей", "Сообщество выпускников")
      .replace(
        "Как собрать обратную связь от первых участников?",
        "Как начать обсуждение?",
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
    expect(html).toContain("Как начать обсуждение?");
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
    expect(billing).toContain("Billing: как работает модуль");
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
