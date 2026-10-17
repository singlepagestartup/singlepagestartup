import { Component as SharedIcon } from "../../../apps/studio/modules/shared/icon";
import { expect, test } from "bun:test";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";
import { Component as RbacModuleSubject } from "../../../apps/studio/modules/rbac/subject";
import { Component as WebsiteBuilderModuleButton } from "../../../apps/studio/modules/website-builder/button";
import { Component as WebsiteBuilderModuleWidget } from "../../../apps/studio/modules/website-builder/widget";
import { Component as WebsiteBuilderModuleFeature } from "../../../apps/studio/modules/website-builder/feature";
import { Component as HostModuleLayout } from "../../../apps/studio/modules/host/layout";
import { Component as HostModuleMetadata } from "../../../apps/studio/modules/host/metadata";
import { Component as HostModulePage } from "../../../apps/studio/modules/host/page";
import { Component as HostModuleWidget } from "../../../apps/studio/modules/host/widget";

const modules = path.resolve(import.meta.dir, "../../../apps/studio/modules");

function files(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? files(file) : [file];
  });
}

function unwrap(node: ts.Node | undefined): ts.Node | undefined {
  while (node && ts.isParenthesizedExpression(node)) node = node.expression;
  return node;
}

function componentFunction(
  tree: ts.SourceFile,
  name: string,
): ts.FunctionLikeDeclaration | undefined {
  for (const statement of tree.statements) {
    if (ts.isFunctionDeclaration(statement) && statement.name?.text === name)
      return statement;
    if (!ts.isVariableStatement(statement)) continue;
    const declaration = statement.declarationList.declarations.find(
      (item) => item.name.getText(tree) === name,
    );
    let initializer = unwrap(declaration?.initializer);
    if (initializer && ts.isCallExpression(initializer)) {
      initializer = unwrap(initializer.arguments[0]);
      if (initializer && ts.isIdentifier(initializer))
        return componentFunction(tree, initializer.text);
    }
    if (
      initializer &&
      (ts.isFunctionExpression(initializer) || ts.isArrowFunction(initializer))
    )
      return initializer;
  }
}

function rootTag(html: string) {
  // React may emit resource hints before the rendered element.
  return html.replace(/<link\b[^>]*>/g, "").match(/^<[^>]+>/)?.[0] ?? "";
}

function expectRoot(
  html: string,
  module: string,
  model: string,
  variant: string,
) {
  const root = rootTag(html);
  expect(root).toContain(`data-module="${module}"`);
  expect(root).toContain(`data-model="${model}"`);
  expect(root).toContain(`data-variant="${variant}"`);
}

test("every Studio variant identifies its own DOM roots, including empty states and portals", () => {
  const violations: string[] = [];
  const variants = files(modules).filter((file) =>
    /\/modules\/[^/]+\/[^/]+\/(singlepage|startup)\/.+\/Component\.tsx$/.test(
      file,
    ),
  );
  for (const file of variants) {
    const [module, model] = path.relative(modules, file).split(path.sep);
    const visited = new Set<string>();
    function inspectFunction(file: string, name: string) {
      const key = `${file}:${name}`;
      if (visited.has(key)) return;
      visited.add(key);
      const tree = ts.createSourceFile(
        file,
        readFileSync(file, "utf8"),
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TSX,
      );
      const fn = componentFunction(tree, name);
      if (!fn?.body) {
        violations.push(`${key}: missing render function`);
        return;
      }
      function inspect(node: ts.Node | undefined) {
        node = unwrap(node);
        if (!node) return;
        if (ts.isConditionalExpression(node)) {
          inspect(node.whenTrue);
          inspect(node.whenFalse);
        } else if (ts.isBinaryExpression(node)) {
          inspect(node.right);
        } else if (ts.isJsxExpression(node)) {
          inspect(node.expression);
        } else if (ts.isJsxFragment(node)) {
          node.children.forEach(inspect);
        } else if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
          const opening = ts.isJsxElement(node) ? node.openingElement : node;
          const tag = opening.tagName.getText(tree);
          if (
            /^[a-z]/.test(tag) ||
            /^(Dialog|DropdownMenu)\.(Content|Overlay)$/.test(tag)
          ) {
            const attributes = new Map(
              opening.attributes.properties.flatMap((attribute) =>
                ts.isJsxAttribute(attribute)
                  ? [
                      [
                        attribute.name.getText(tree),
                        attribute.initializer?.getText(tree),
                      ],
                    ]
                  : [],
              ),
            );
            const hostHelper = file.includes("/HostRecords/");
            if (
              !(
                attributes.get("data-module") === JSON.stringify(module) ||
                (hostHelper &&
                  attributes.get("data-module") ===
                    '{model ? "host" : undefined}')
              ) ||
              !(
                attributes.get("data-model") === JSON.stringify(model) ||
                (hostHelper && attributes.get("data-model") === "{model}")
              ) ||
              !attributes.get("data-variant")
            )
              violations.push(`${key}: unmarked root <${tag}>`);
          } else if (
            /\.Provider$/.test(tag) ||
            [
              "ThreadProvider",
              "ProjectProvider",
              "HostStudioProvider",
            ].includes(tag) ||
            /^(Dialog|DropdownMenu)\.(Root|Portal|Trigger|Item)$/.test(tag)
          ) {
            if (ts.isJsxElement(node)) node.children.forEach(inspect);
          } else if (componentFunction(tree, tag)) {
            inspectFunction(file, tag);
          } else {
            // Same-model render helpers forward the selected variant without an extra DOM wrapper.
            const imported = tree.statements.find(
              (statement) =>
                ts.isImportDeclaration(statement) &&
                statement.importClause?.namedBindings &&
                ts.isNamedImports(statement.importClause.namedBindings) &&
                statement.importClause.namedBindings.elements.some(
                  (binding) => binding.name.text === tag,
                ),
            ) as ts.ImportDeclaration | undefined;
            if (!imported || !ts.isStringLiteral(imported.moduleSpecifier)) {
              violations.push(`${key}: unknown root <${tag}>`);
              return;
            }
            const target = path.resolve(
              path.dirname(file),
              imported.moduleSpecifier.text,
            );
            const entry = target.replace(/\/index$/, "");
            if (
              /\/modules\/[^/]+\/[^/]+$/.test(entry) &&
              existsSync(path.join(entry, "variants.ts"))
            ) {
              // Public model composition is a boundary; its registered renderers
              // are inspected separately. The caller must select its variant.
              if (
                !opening.attributes.properties.some(
                  (attribute) =>
                    ts.isJsxAttribute(attribute) &&
                    attribute.name.getText(tree) === "variant",
                )
              )
                violations.push(
                  `${key}: public model root needs an explicit variant <${tag}>`,
                );
              return;
            }
            const helperFile = target.endsWith("/HostRecords/index")
              ? path.join(
                  path.dirname(target),
                  `${tag === "HostRecordPreview" ? "Preview" : tag === "HostWorkbench" ? "Workbench" : "Model"}.tsx`,
                )
              : undefined;
            const helper = [
              ...(helperFile ? [helperFile] : []),
              target + ".tsx",
              path.join(target, "Component.tsx"),
              path.join(path.dirname(target), "Component.tsx"),
            ].find(existsSync);
            if (!helper) violations.push(`${key}: unresolved root <${tag}>`);
            else {
              const binding = (
                imported.importClause!.namedBindings as ts.NamedImports
              ).elements.find((item) => item.name.text === tag)!;
              inspectFunction(
                helper,
                binding.propertyName?.text ?? binding.name.text,
              );
            }
          }
        }
      }
      function returns(node: ts.Node) {
        if (node !== fn && ts.isFunctionLike(node)) return;
        if (ts.isReturnStatement(node)) inspect(node.expression);
        ts.forEachChild(node, returns);
      }
      returns(fn);
    }
    const index = readFileSync(
      path.join(path.dirname(file), "index.ts"),
      "utf8",
    );
    const name = index.match(/export\s*\{\s*(\w+)(?:\s+as\s+Component)?/)![1];
    inspectFunction(file, name);
  }
  expect(variants.length).toBeGreaterThan(0);
  expect(violations).toEqual([]);
});

for (const entry of files(modules).filter((file) =>
  /\/modules\/[^/]+\/[^/]+\/Component\.tsx$/.test(file),
)) {
  const [module, model] = path.relative(modules, entry).split(path.sep);
  test(`${module}.${model}: model roots retain metadata across preview states`, async () => {
    const { Component } = await import(entry);
    const { variants } = await import(
      path.join(path.dirname(entry), "variants.ts")
    );
    const states = [
      { variant: "admin-v2-card" },
      { variant: "admin-v2-card", id: "missing-preview-record" },
      { variant: "admin-v2-table", empty: true },
      { variant: "list", count: 2 },
      { variant: "list", empty: true },
      { variant: "button-default" },
      { variant: "phosphor", name: "user" },
      { variant: "custom", name: "star-fill" },
      ...(module === "shared" && model === "toast"
        ? [
            { variant: "default", type: "success" },
            { variant: "default", type: "error" },
            { variant: "default", type: "loading" },
            { variant: "icons" },
          ]
        : []),
    ].filter((props) => props.variant in variants);
    expect(states.length).toBeGreaterThan(0);
    for (const props of states)
      expectRoot(
        renderToStaticMarkup(createElement(Component, props)),
        module,
        model,
        props.variant,
      );
  });
}

test("delegated Subject forms and startup overrides preserve the selected variant", () => {
  for (const variant of [
    "me-authentication-select-method-ai-chat",
    "me-authentication-select-method-default",
  ] as const)
    expectRoot(
      renderToStaticMarkup(<RbacModuleSubject variant={variant} />),
      "rbac",
      "subject",
      variant,
    );
  expectRoot(
    renderToStaticMarkup(
      <WebsiteBuilderModuleWidget variant="content-default" />,
    ),
    "website-builder",
    "widget",
    "content-default",
  );
});

test("Host provider variants mark existing view roots and preserve embedded form layout", () => {
  for (const [model, element] of [
    ["layout", <HostModuleLayout variant="admin-v2-form" embedded />],
    ["metadata", <HostModuleMetadata variant="admin-v2-form" embedded />],
    ["page", <HostModulePage variant="admin-v2-form" embedded />],
    ["widget", <HostModuleWidget variant="admin-v2-form" embedded />],
  ] as const) {
    const html = renderToStaticMarkup(element);
    expectRoot(html, "host", model, "admin-v2-form");
    expect(rootTag(html)).toStartWith("<section");
    expect(rootTag(html)).toContain('class="flex min-h-0 flex-1 flex-col"');
  }
  expectRoot(
    renderToStaticMarkup(<HostModulePage variant="composition" />),
    "host",
    "page",
    "composition",
  );
  expectRoot(
    renderToStaticMarkup(<HostModuleLayout variant="default" />),
    "host",
    "layout",
    "default",
  );
  expectRoot(
    renderToStaticMarkup(
      <HostModuleMetadata variant="admin-v2-select-input" />,
    ),
    "host",
    "metadata",
    "admin-v2-select-input",
  );
});

test("controls and glyphs identify the native element without a layout wrapper", () => {
  const button = renderToStaticMarkup(
    <WebsiteBuilderModuleButton variant="control">
      Continue
    </WebsiteBuilderModuleButton>,
  );
  const glyph = renderToStaticMarkup(
    <SharedIcon variant="phosphor" name="user" />,
  );
  expect(button).toStartWith("<button");
  expect(glyph).toStartWith("<svg");
  expectRoot(button, "website-builder", "button", "control");
  expectRoot(glyph, "shared", "icon", "phosphor");
  expect(button).not.toContain(' variant="');
});
