import { expect, test } from "bun:test";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import ts from "typescript";

const studio = path.resolve(import.meta.dir, "../../../apps/studio");
const modules = path.join(studio, "modules");

function files(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? files(file) : [file];
  });
}

function resolve(file: string, specifier: string) {
  const target = path.resolve(path.dirname(file), specifier.split("?")[0]);
  const resolved = [
    target,
    target + ".ts",
    target + ".tsx",
    target + ".json",
    path.join(target, "index.ts"),
    path.join(target, "index.tsx"),
  ].find((candidate) => existsSync(candidate) && statSync(candidate).isFile());
  if (!resolved) throw new Error(`Unresolved import: ${file} → ${specifier}`);
  return resolved;
}

function runtimeImports(file: string) {
  if (!/\.[jt]sx?$/.test(file)) return [];
  const tree = ts.createSourceFile(
    file,
    readFileSync(file, "utf8"),
    ts.ScriptTarget.Latest,
    true,
  );
  return tree.statements.flatMap((node) => {
    if (
      !(ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) ||
      !node.moduleSpecifier ||
      !ts.isStringLiteral(node.moduleSpecifier) ||
      (ts.isExportDeclaration(node) && node.isTypeOnly) ||
      (ts.isImportDeclaration(node) && node.importClause?.isTypeOnly)
    )
      return [];
    if (ts.isImportDeclaration(node)) {
      const bindings = node.importClause?.namedBindings;
      if (
        bindings &&
        ts.isNamedImports(bindings) &&
        !node.importClause?.name &&
        bindings.elements.every((element) => element.isTypeOnly)
      )
        return [];
    }
    const specifier = node.moduleSpecifier.text;
    return specifier.startsWith(".") ? [resolve(file, specifier)] : [];
  });
}

test("public Studio model entries have no runtime import cycles", () => {
  const visited = new Set<string>();
  const active: string[] = [];
  function visit(file: string) {
    const index = active.indexOf(file);
    if (index !== -1)
      throw new Error(active.slice(index).concat(file).join(" → "));
    if (visited.has(file) || file.endsWith(".json")) return;
    expect(file.startsWith(studio + path.sep)).toBe(true);
    active.push(file);
    for (const imported of runtimeImports(file)) visit(imported);
    active.pop();
    visited.add(file);
  }
  for (const file of files(modules).filter((file) =>
    /\/modules\/[^/]+\/[^/]+\/Component\.tsx$/.test(file),
  ))
    visit(file);
  expect(
    visited.has(
      path.join(
        modules,
        "social/profile/singlepage/project/select/item/ai-chat/Component.tsx",
      ),
    ),
  ).toBe(true);
});

test("cross-model Component imports use entity entries and native names", () => {
  const violations: string[] = [];
  const pascal = (value: string) =>
    value
      .split("-")
      .map((word) => word[0].toUpperCase() + word.slice(1))
      .join("");
  for (const file of files(modules).filter(
    (file) => /\.tsx?$/.test(file) && !/\.test\.tsx?$/.test(file),
  )) {
    const tree = ts.createSourceFile(
      file,
      readFileSync(file, "utf8"),
      ts.ScriptTarget.Latest,
      true,
    );
    for (const node of tree.statements) {
      if (
        !ts.isImportDeclaration(node) ||
        !ts.isStringLiteral(node.moduleSpecifier)
      )
        continue;
      const bindings = node.importClause?.namedBindings;
      if (!bindings || !ts.isNamedImports(bindings)) continue;
      if (node.importClause?.isTypeOnly) continue;
      const specifier = node.moduleSpecifier.text;
      if (!specifier.startsWith(".")) continue;
      const target = resolve(file, node.moduleSpecifier.text);
      const match = target.match(/\/modules\/([^/]+)\/([^/]+)\/(.*)$/);
      if (!match) continue;
      const [, module, entity, suffix] = match;
      const owner = path.join(modules, module, entity);
      // A variant uses private siblings; importing its own dispatcher creates a cycle.
      if (file.startsWith(owner + path.sep)) continue;
      // Providers and private helpers are separate from registered model views.
      const variantView =
        /^(singlepage|startup)\/.+\/(Component\.tsx|index\.ts)$/.test(suffix) &&
        existsSync(path.join(path.dirname(target), "block.manifest.json"));
      const imported = bindings.elements.find((element) => {
        if (element.isTypeOnly) return false;
        const name = element.propertyName?.text ?? element.name.text;
        return name === "Component" || (variantView && /^[A-Z]/.test(name));
      });
      if (!imported) continue;
      const alias = pascal(module) + "Module" + pascal(entity);
      if (suffix !== "index.ts" || imported.name.text !== alias)
        violations.push(
          `${path.relative(studio, file)} → ${node.moduleSpecifier.text} as ${imported.name.text}`,
        );
    }
  }
  expect(violations).toEqual([]);
});

test("entity registries overlay startup variants after singlepage variants", () => {
  for (const entry of files(modules).filter((file) =>
    /\/modules\/[^/]+\/[^/]+\/Component\.tsx$/.test(file),
  )) {
    const source = readFileSync(entry, "utf8");
    expect(source).not.toMatch(/\bswitch\s*\(/);
    const registry = path.join(path.dirname(entry), "variants.ts");
    expect(runtimeImports(entry)).toEqual([registry]);
    expect(runtimeImports(registry)).toEqual([
      path.join(path.dirname(entry), "singlepage/variants.ts"),
      path.join(path.dirname(entry), "startup/variants.ts"),
    ]);
    const tree = ts.createSourceFile(
      registry,
      readFileSync(registry, "utf8"),
      ts.ScriptTarget.Latest,
      true,
    );
    const declaration = tree.statements
      .filter(ts.isVariableStatement)
      .flatMap((statement) => statement.declarationList.declarations)
      .find((declaration) => declaration.name.getText(tree) === "variants");
    expect(declaration?.initializer).toBeDefined();
    const value = declaration!.initializer!;
    expect(ts.isObjectLiteralExpression(value)).toBe(true);
    if (ts.isObjectLiteralExpression(value))
      expect(
        value.properties.map((property) =>
          ts.isSpreadAssignment(property)
            ? property.expression.getText(tree)
            : property.getText(tree),
        ),
      ).toEqual(["singlepageVariants", "startupVariants"]);
  }
});

test("explicit model variants cannot be overwritten by display prop spreads", () => {
  const violations: string[] = [];
  for (const file of files(modules).filter((file) => file.endsWith(".tsx"))) {
    const tree = ts.createSourceFile(
      file,
      readFileSync(file, "utf8"),
      ts.ScriptTarget.Latest,
      true,
    );
    const modelNames = new Set(
      tree.statements.filter(ts.isImportDeclaration).flatMap((node) => {
        const bindings = node.importClause?.namedBindings;
        if (!bindings || !ts.isNamedImports(bindings)) return [];
        return bindings.elements
          .filter(
            (item) =>
              item.propertyName?.text === "Component" &&
              item.name.text.includes("Module"),
          )
          .map((item) => item.name.text);
      }),
    );
    function visit(node: ts.Node) {
      if (
        (ts.isJsxSelfClosingElement(node) || ts.isJsxOpeningElement(node)) &&
        ts.isIdentifier(node.tagName) &&
        modelNames.has(node.tagName.text)
      ) {
        const attrs = node.attributes.properties;
        const variant = attrs.find(
          (attr) =>
            ts.isJsxAttribute(attr) && attr.name.getText(tree) === "variant",
        );
        if (
          variant &&
          attrs.some(
            (attr) => ts.isJsxSpreadAttribute(attr) && attr.end > variant.end,
          )
        ) {
          violations.push(
            `${path.relative(studio, file)}: ${node.tagName.text}`,
          );
        }
      }
      ts.forEachChild(node, visit);
    }
    visit(tree);
  }
  expect(violations).toEqual([]);
});

test("Studio module stories display models without relation or API filter contracts", () => {
  const sources = files(modules).filter(
    (file) =>
      /\.(ts|tsx)$/.test(file) &&
      !file.endsWith(".test.tsx") &&
      !file.endsWith(".test.ts"),
  );
  for (const file of sources) {
    expect(file.includes("/relations/")).toBe(false);
    expect(file.includes("/models/")).toBe(false);
    const source = readFileSync(file, "utf8");
    expect(source).not.toContain("apiProps");
    expect(source).not.toContain('variant="find"');
    expect(source).not.toContain("findLocalRelations");
  }
});

test("AI Chat model variants put purpose before visual style and mirror nested folders", () => {
  let checked = 0;
  for (const file of files(modules).filter((file) =>
    file.endsWith("/block.manifest.json"),
  )) {
    const block = JSON.parse(readFileSync(file, "utf8"));
    const { module, entity, variant } = block.source;
    // Page keys describe URLs; model display variants describe their purpose.
    if (
      (module === "host" && entity === "page") ||
      !variant.includes("ai-chat")
    )
      continue;
    expect(variant.startsWith("ai-chat")).toBe(false);
    expect(variant.endsWith("-ai-chat")).toBe(true);
    const variantPath = path.relative(
      path.join(modules, module, entity, "singlepage"),
      path.dirname(file),
    );
    expect(variantPath.split(path.sep).join("-")).toBe(variant);
    checked++;
  }
  expect(checked).toBe(45);
});
