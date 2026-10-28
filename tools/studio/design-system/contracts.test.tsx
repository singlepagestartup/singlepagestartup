import { expect, test } from "bun:test";
import {
  existsSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
  mkdirSync,
} from "node:fs";
import path from "node:path";
import { tmpdir } from "node:os";
import ts from "typescript";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Component as SharedIcon } from "../../../apps/studio/modules/shared/icon";
import glyphs from "../../../apps/studio/modules/shared/icon/singlepage/phosphor/icons.json";
import { collectModuleInventory } from "./inventory";
import { effectivePropsContract, projectionInterface } from "./contracts";
import { projectionComponent } from "./projection";

const root = path.resolve(import.meta.dir, "../../..");
const modules = path.join(root, "apps/studio/modules");
function files(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory()
      ? files(path.join(directory, entry.name))
      : [path.join(directory, entry.name)],
  );
}
function tree(file: string) {
  return ts.createSourceFile(
    file,
    readFileSync(file, "utf8"),
    ts.ScriptTarget.Latest,
    true,
  );
}

/** This checks each authored variant, not merely the derived root union. */
test("every variant owns its public literal contract and the layer registers it", () => {
  const variants = files(modules).filter((file) =>
    /\/modules\/[^/]+\/[^/]+\/(singlepage|startup)\/.+\/Component\.tsx$/.test(
      file,
    ),
  );
  expect(variants.length).toBeGreaterThan(400);
  for (const file of variants) {
    const contract = path.join(path.dirname(file), "interface.ts");
    expect(existsSync(contract), file).toBe(true);
    const source = tree(contract);
    for (const statement of source.statements) {
      if (
        ts.isImportDeclaration(statement) &&
        ts.isStringLiteral(statement.moduleSpecifier)
      )
        expect(statement.moduleSpecifier.text, contract).not.toMatch(
          /\/(?:Component|Skeleton|Error)$/,
        );
    }
    const declarations = source.statements.filter(ts.isInterfaceDeclaration);
    expect(
      declarations.some((node) => node.name.text === "IComponentProps"),
      contract,
    ).toBe(true);
    expect(
      declarations.some((node) => node.name.text === "IComponentPropsExtended"),
      contract,
    ).toBe(true);
    let literal: string | undefined;
    for (const statement of source.statements)
      if (ts.isVariableStatement(statement))
        for (const declaration of statement.declarationList.declarations)
          if (
            declaration.name.getText(source) === "variant" &&
            declaration.initializer
          ) {
            const value = ts.isAsExpression(declaration.initializer)
              ? declaration.initializer.expression
              : declaration.initializer;
            if (ts.isStringLiteral(value)) literal = value.text;
          }
    expect(literal, contract).toBeTruthy();
    const variantRoot = file.match(/^(.*\/(?:singlepage|startup))\//)![1];
    const registryTree = tree(path.join(variantRoot, "variants.ts"));
    const bindings = new Map<string, string>();
    for (const statement of registryTree.statements) {
      if (
        !ts.isImportDeclaration(statement) ||
        !ts.isStringLiteral(statement.moduleSpecifier)
      )
        continue;
      const names = statement.importClause?.namedBindings;
      if (names && ts.isNamedImports(names))
        for (const name of names.elements) {
          const target = path
            .resolve(variantRoot, statement.moduleSpecifier.text)
            .replace(/\/(?:index|Component)(?:\.tsx?)?$/, "");
          bindings.set(name.name.text, target);
        }
    }
    let registered = false;
    function inspectRegistry(node: ts.Node) {
      if (
        ts.isPropertyAssignment(node) &&
        node.name.getText(registryTree).replace(/^['"]|['"]$/g, "") ===
          literal &&
        bindings.get(node.initializer.getText(registryTree)) ===
          path.dirname(file)
      )
        registered = true;
      ts.forEachChild(node, inspectRegistry);
    }
    inspectRegistry(registryTree);
    expect(
      registered,
      `${contract}: literal must select its own public variant entry`,
    ).toBe(true);
    const implementation = tree(file);
    for (const statement of implementation.statements)
      if (
        (ts.isInterfaceDeclaration(statement) ||
          ts.isTypeAliasDeclaration(statement)) &&
        statement.modifiers?.some(
          (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword,
        )
      )
        throw new Error(
          `Public type belongs in interface.ts: ${file}:${statement.name.text}`,
        );
    expect(
      readFileSync(path.join(path.dirname(file), "index.ts"), "utf8"),
      file,
    ).toContain('from "./interface"');
    function inspect(node: ts.Node) {
      if (
        ts.isPropertySignature(node) &&
        node.name.getText(source) === "variant"
      )
        expect(node.type?.kind, contract).not.toBe(ts.SyntaxKind.StringKeyword);
      ts.forEachChild(node, inspect);
    }
    for (const declaration of declarations.filter(
      (node) => node.name.text !== "IRecord",
    ))
      inspect(declaration);
  }
}, 30_000);

test("component registry aliases and story wrappers name their responsibility", () => {
  for (const file of files(modules).filter((file) => /\.[jt]sx?$/.test(file))) {
    const source = tree(file);
    for (const statement of source.statements) {
      if (ts.isImportDeclaration(statement)) {
        const bindings = statement.importClause?.namedBindings;
        if (bindings && ts.isNamedImports(bindings))
          for (const item of bindings.elements)
            if (item.propertyName?.text === "Component")
              expect(item.name.text, file).not.toMatch(
                /^(?:Variant|IdentityAction|SubjectAction)\d+$/,
              );
      }
      if (/\.stories\.tsx$/.test(file) && ts.isFunctionDeclaration(statement))
        expect(statement.name?.text, file).not.toBe("Example");
    }
  }
});

test("stories bind public model entries to the owning variant contract", () => {
  for (const file of files(modules).filter((file) =>
    /Component\.stories\.tsx$/.test(file),
  )) {
    const source = tree(file);
    const imports = new Map<string, string>();
    for (const statement of source.statements) {
      if (
        !ts.isImportDeclaration(statement) ||
        !ts.isStringLiteral(statement.moduleSpecifier)
      )
        continue;
      const names = statement.importClause?.namedBindings;
      if (names && ts.isNamedImports(names))
        for (const name of names.elements)
          imports.set(name.name.text, statement.moduleSpecifier.text);
    }
    function inspect(node: ts.Node) {
      if (ts.isObjectLiteralExpression(node)) {
        const component = node.properties.find(
          (property) =>
            ts.isPropertyAssignment(property) &&
            property.name.getText(source) === "component",
        ) as ts.PropertyAssignment | undefined;
        if (component && ts.isIdentifier(component.initializer)) {
          const specifier = imports.get(component.initializer.text);
          if (specifier) {
            expect(specifier, file).not.toMatch(/^\.\/(?:Component|index)$/);
            const target = path
              .resolve(path.dirname(file), specifier)
              .replace(/\/index$/, "");
            if (/\/modules\/[^/]+\/[^/]+$/.test(target)) {
              const props = node.properties.find(
                (property) =>
                  ts.isPropertyAssignment(property) &&
                  property.name.getText(source) === "args",
              ) as ts.PropertyAssignment | undefined;
              expect(
                props &&
                  ts.isObjectLiteralExpression(props.initializer) &&
                  props.initializer.properties.some(
                    (property) =>
                      ts.isPropertyAssignment(property) &&
                      property.name.getText(source) === "variant" &&
                      ts.isStringLiteral(property.initializer),
                  ),
                file,
              ).toBe(true);
            }
          }
        }
      }
      ts.forEachChild(node, inspect);
    }
    inspect(source);
  }
});

test("static icons render every registered glyph without model providers", () => {
  expect(Object.keys(glyphs)).toHaveLength(90);
  for (const name of Object.keys(glyphs) as Array<keyof typeof glyphs>) {
    const html = renderToStaticMarkup(
      <SharedIcon
        variant="phosphor"
        name={name}
        svgProps={{ "aria-label": name }}
      />,
    );
    expect(html).toContain(`data-icon-name="${name}"`);
    expect(html).toContain('fill="currentColor"');
    expect(html).toContain("<path");
  }
  expect(
    renderToStaticMarkup(<SharedIcon variant="custom" name="star-fill" />),
  ).toContain('data-icon-name="star-fill"');
  expect(
    readFileSync(
      path.join(modules, "shared/icon/singlepage/phosphor/LICENSE"),
      "utf8",
    ),
  ).toContain("MIT");
  for (const file of files(modules).filter((file) => /\.[jt]sx?$/.test(file))) {
    const source = readFileSync(file, "utf8");
    expect(source, file).not.toMatch(
      /(?:feature\/singlepage\/icon|from ["']\.\.\/icon\/)/,
    );
    expect(source, file).not.toMatch(
      /<WebsiteBuilderModuleFeature\b[^>]*\bvariant="icon"/,
    );
  }
});

test("every current model entry exports a provider-free responsive Skeleton and Loading story", async () => {
  const inventory = await collectModuleInventory();
  const entries = new Set(
    inventory.modules.flatMap((module) =>
      module.entities.map((entity) => `${module.name}/${entity.entity}`),
    ),
  );
  // Include Studio-only presentation models as well as production inventory models.
  for (const file of files(modules).filter(
    (file) =>
      /\/modules\/[^/]+\/[^/]+\/Component\.tsx$/.test(file) &&
      !file.includes("/modules/shared/"),
  ))
    entries.add(path.relative(modules, path.dirname(file)));
  expect(entries.size).toBeGreaterThanOrEqual(63);
  for (const entry of entries) {
    const directory = path.join(modules, entry);
    const exports = await import(path.join(directory, "index.ts"));
    expect(typeof exports.Skeleton, entry).toBe("function");
    for (const variant of ["list", "create-form", "avatar"]) {
      const html = renderToStaticMarkup(
        createElement(exports.Skeleton, { variant, rows: 2 }),
      );
      expect(html, entry).toContain('role="status"');
      expect(html, entry).toContain('aria-busy="true"');
      expect(html, entry).toContain("motion-safe:animate-pulse");
      expect(html, entry).toContain('aria-hidden="true"');
    }
    expect(
      readFileSync(path.join(directory, "Skeleton.stories.tsx"), "utf8"),
      entry,
    ).toContain("export const Loading");
  }
}, 30_000);

test("document, project and conversation loading use their model's composition", async () => {
  for (const [owner, variant, layout] of [
    ["knowledge/source", "id-ai-chat", "document"],
    ["social/profile", "scope-ai-chat-project", "project"],
    ["social/thread", "id-ai-chat", "conversation"],
    ["social/chat", "id-ai-chat", "conversation"],
    ["file-storage/file", "id-ai-chat", "image"],
  ]) {
    const { Skeleton } = await import(path.join(modules, owner, "index.ts"));
    const html = renderToStaticMarkup(createElement(Skeleton, { variant }));
    expect(html).toContain(`data-skeleton-layout="${layout}"`);
    expect(html).toContain('aria-busy="true"');
  }
});

test("effective contracts replace base props with startup props and preserve unrelated required inputs", () => {
  const fixture = mkdtempSync(path.join(tmpdir(), "studio-contract-types-"));
  try {
    const put = (file: string, source: string) => {
      const target = path.join(fixture, file);
      mkdirSync(path.dirname(target), { recursive: true });
      writeFileSync(target, source);
    };
    put(
      "singlepage/variants.ts",
      'export const variants = { shared: (_props: { variant?: "shared"; base: string }) => null, "base-only": (_props: { variant?: "base-only"; required: boolean }) => null };',
    );
    put(
      "startup/variants.ts",
      'export const variants = { shared: (_props: { variant?: "shared"; startup: number }) => null, "startup-only": (_props: { variant?: "startup-only"; extra: string }) => null };',
    );
    put(
      "variants.ts",
      'import { variants as singlepage } from "./singlepage/variants"; import { variants as startup } from "./startup/variants"; export const variants = { ...singlepage, ...startup };',
    );
    put("interface.ts", effectivePropsContract);
    put(
      "input.ts",
      `import type { IComponentProps } from "./interface";
const override: IComponentProps = { variant: "shared", startup: 1 };
const inherited: IComponentProps = { variant: "base-only", required: true };
const own: IComponentProps = { variant: "startup-only", extra: "ready" };
// @ts-expect-error startup replaces the base contract
const stale: IComponentProps = { variant: "shared", base: "wrong" };
// @ts-expect-error variant-specific required prop is preserved
const missing: IComponentProps = { variant: "base-only" };
// @ts-expect-error unrelated variants cannot receive each other's props
const wrong: IComponentProps = { variant: "base-only", startup: 1 };
// @ts-expect-error missing variant is not a public contract
const absent: IComponentProps = { startup: 1 };
// @ts-expect-error unknown variant
const unknown: IComponentProps = { variant: "unknown" };
`,
    );
    const program = ts.createProgram([path.join(fixture, "input.ts")], {
      noEmit: true,
      strict: true,
      skipLibCheck: true,
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      types: [],
      paths: {
        react: [path.join(root, "node_modules/@types/react/index.d.ts")],
      },
    });
    const diagnostics = ts.getPreEmitDiagnostics(program);
    expect(
      diagnostics.map((diagnostic) =>
        ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"),
      ),
    ).toEqual([]);
  } finally {
    rmSync(fixture, { recursive: true, force: true });
  }
});

test("projection generation separates view and literal props contracts", () => {
  for (const variant of ["admin-v2-table", "admin-v2-card", "list"] as const) {
    expect(projectionComponent(variant)).not.toContain(
      "export interface IComponentProps",
    );
    expect(projectionComponent(variant)).toContain('from "./interface"');
    expect(projectionInterface(variant)).toContain(
      `export const variant = "${variant}"`,
    );
    expect(projectionInterface(variant)).toContain("variant?: typeof variant");
  }
});
