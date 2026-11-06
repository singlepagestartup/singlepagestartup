import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { websiteContent } from "./content";
import { SiteShell } from "./Site";
import Modules from "./Modules";
import Tokens from "./Tokens";
import { pageContent, tokenCredit } from "./Tokens/content";
import {
  frameworkModules,
  filterModules,
  readModuleSlug,
} from "./Modules/content";
test("website shell renders owned navigation and allows explicit content inputs", () => {
  const content = structuredClone(websiteContent);
  content.footer.paragraphs[0] = "Current business explanation";
  const html = renderToStaticMarkup(
    <SiteShell content={content}>
      <main>Content</main>
    </SiteShell>,
  );
  expect(html).toContain("Current business explanation");
  expect(html).toContain(content.labels["navigation-framework"]);
});
test("module search and deep links retain their business context", () => {
  expect(frameworkModules.length).toBeGreaterThan(10);
  expect(filterModules(frameworkModules, "", "платеж").length).toBeGreaterThan(
    0,
  );
  expect(readModuleSlug("/framework/modules/rbac")).toBe("rbac");
  expect(readModuleSlug("/framework/modules/%E0%A4%A")).toBe(
    "invalid-module-route",
  );
  expect(renderToStaticMarkup(<Modules />)).toContain(
    'href="/framework/modules/rbac"',
  );
});
test("token pricing and layout consume the same owned data", () => {
  expect(pageContent.topups.packages.length).toBeGreaterThan(0);
  for (const pack of pageContent.topups.packages)
    expect(tokenCredit(pack)).toBe(Math.round(pack.amount / pack.rate));
  expect(renderToStaticMarkup(<Tokens />)).toContain(pageContent.hero.title);
});
