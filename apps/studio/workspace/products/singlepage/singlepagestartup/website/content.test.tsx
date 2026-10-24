import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { parseCodeFrameworkWebsite } from "./content";
import { SiteShell } from "./Site";
import ModulesPage from "./Modules";
import { parseModules, readModuleSlug } from "./Modules/content";

const landing = readFileSync(new URL("./page.md", import.meta.url), "utf8");
const modules = readFileSync(
  new URL("./Modules/page.md", import.meta.url),
  "utf8",
);

describe("editable Framework website copy", () => {
  test("renders authored navigation, footer prose and changed footer URLs", () => {
    const edited = landing
      .replace(/(\| navigation-chat\s*\|)[^|]+/, "$1 Prepare the brief ")
      .replace(
        "Prepare your business in AI Chat. Build your product with Code Framework.",
        "Bring your reviewed project material.",
      )
      .replace("[Blog](/blog)", "[Engineering journal](/journal)");
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
        "A place for each part of your product.",
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
});
