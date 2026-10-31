/**
 * BDD Suite: module API registration.
 * Given: API composition with a shared module registry.
 * When: a module is attached or detached.
 * Then: its import and registry entry serve both HTTP mounting and descriptions.
 */
import {
  ImportBackendAppApiAsPropertyCasedAppName,
  ExtendApiModules,
} from "./Coder";

const imports = new ImportBackendAppApiAsPropertyCasedAppName({
  importPath: "@sps/website-builder/backend/app/api",
  asPropertyCasedAppName: "websiteBuilder",
});
const registry = new ExtendApiModules({
  asPropertyCasedAppName: "websiteBuilder",
  kebabCasedAppName: "website-builder",
});

it.each(["Hono", "Hono<Env>"])(
  "adds the import without changing the %s application declaration",
  (constructor) => {
    const declaration = `export const app = new ${constructor}().basePath("/");`;
    const attached = declaration.replace(
      imports.onCreate.regex,
      imports.onCreate.content,
    );
    expect(attached).toContain(
      'import { app as websiteBuilderApp } from "@sps/website-builder/backend/app/api";',
    );
    expect(attached).toContain(declaration);
    expect(
      attached.replace(imports.onRemove.regex, imports.onRemove.content).trim(),
    ).toBe(declaration);
  },
);

it("adds a module to the shared registry and removes it without a separate Hono registration", () => {
  const original = "const apiModules = {\n  blog: blogApp,\n};";
  const attached = original.replace(
    registry.onCreate.regex,
    registry.onCreate.content,
  );
  expect(attached).toContain('"website-builder": websiteBuilderApp,');
  expect(attached).toContain("blog: blogApp,");
  expect(attached).not.toContain("app.route(");
  expect(
    attached.replace(registry.onRemove.regex, registry.onRemove.content),
  ).toBe(original);
});

it.each(['"probe"', "probe"])(
  "removes the %s key after generator formatting",
  (key) => {
    const probe = new ExtendApiModules({
      asPropertyCasedAppName: "probe",
      kebabCasedAppName: "probe",
    });
    const original = `const apiModules = {\n  ${key}: probeApp,\n  blog: blogApp,\n};`;
    expect(original.replace(probe.onRemove.regex, probe.onRemove.content)).toBe(
      "const apiModules = {\n  blog: blogApp,\n};",
    );
  },
);
