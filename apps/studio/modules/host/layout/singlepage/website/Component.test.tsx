import { expect, test } from "bun:test";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { Component as Layout } from "../../index";
import { Component as WebsiteBuilderModuleWidget } from "../../../../website-builder/widget/index";

const studio = path.resolve(import.meta.dir, "../../../../..");

test("website Layout receives account/cart slots and keeps them out of main", () => {
  const html = renderToStaticMarkup(
    <Layout
      variant="website"
      subjectAccount={<button>Subject slot</button>}
      cartButton={<button>Cart slot</button>}
      cartDrawer={<aside>Controlled drawer</aside>}
    >
      <main>Page content</main>
    </Layout>,
  );
  const header = html.match(/<header\b[\s\S]*?<\/header>/)?.[0] ?? "";
  expect(header).toContain("Subject slot");
  expect(header).toContain("Cart slot");
  expect(header).toContain('data-ds-block="website-builder.logotype.default"');
  expect(header).toContain(
    'data-ds-block="website-builder.buttons-array.navbar-default"',
  );
  expect(html).toContain("Controlled drawer");
  expect(html).toContain("<main>Page content</main>");
  expect(html).toContain(
    'data-ds-block="website-builder.widget.footer-compact"',
  );
  expect(html).not.toContain('data-ds-block="rbac.subject.me-account"');
  expect(html).not.toContain('data-ds-block="ecommerce.cart.drawer-default"');
});

test("website Layout delegates sign in to Subject and cart to Ecommerce", () => {
  const html = renderToStaticMarkup(
    <Layout variant="website" signedIn={false} />,
  );
  expect(html).toContain('data-ds-block="rbac.subject.me-account"');
  expect(html).toContain('data-ds-block="ecommerce.cart.button-default"');
  expect(html).toContain("Войти");
  expect(html).not.toContain("Admin Panel");
  expect(html).not.toContain('href="/admin"');
});

test("public Pages declare Layout and do not import their own navigation/footer", () => {
  const pages = path.join(studio, "modules/host/page/singlepage");
  for (const directory of readdirSync(pages, { withFileTypes: true })) {
    if (
      !directory.isDirectory() ||
      directory.name.startsWith("admin") ||
      ["composition", "default", "list", "shared", "seo-preview"].includes(
        directory.name,
      )
    )
      continue;
    const source = readFileSync(
      path.join(pages, directory.name, "Component.tsx"),
      "utf8",
    );
    expect(source).not.toContain("HostNavbarDefault");
    expect(source).not.toContain('variant="navbar-default"');
    expect(source).not.toContain('variant="footer-');
    if (/from "(?:\.\.\/framework\/|\.\/Landing")/.test(source)) continue;
    expect(source).toContain("as Layout");
    expect(source).toMatch(/from ["'][^"']+\/layout(?:\/index)?["']/);
  }
});

test("Website Builder navbar uses slots without implementing Subject account state", () => {
  const html = renderToStaticMarkup(
    <WebsiteBuilderModuleWidget
      variant="navbar-default"
      subjectAccount={<button>Account slot</button>}
      cartButton={<button>Cart slot</button>}
    />,
  );
  expect(html).toContain("Account slot");
  expect(html).toContain("Cart slot");
  expect(html).not.toContain("Admin Panel");
  expect(html).not.toContain("Sign In");
  expect(html).not.toContain("Sign Out");
});
