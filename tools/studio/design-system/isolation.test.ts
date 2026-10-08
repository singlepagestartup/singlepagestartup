import { expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import ts from "typescript";

const root = path.resolve(import.meta.dir, "../../..");
const studio = path.join(root, "apps/studio");

function files(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (
      ["node_modules", ".generated", "output", "storybook-static"].includes(
        entry.name,
      )
    )
      return [];
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? files(file) : [file];
  });
}

function forbidden(file: string, specifier: string): boolean {
  const target = specifier.startsWith(".")
    ? path.resolve(path.dirname(file), specifier)
    : specifier;
  return (
    specifier.startsWith("@sps/") ||
    /(?:^|\/)libs(?:\/|$)/.test(target) ||
    /(?:^|\/)apps\/host(?:\/|$)/.test(target)
  );
}

test("detects production aliases and relative imports, including type dependencies", () => {
  expect(
    forbidden(
      path.join(studio, "runtime/view.ts"),
      "@sps/host/models/page/sdk/model",
    ),
  ).toBe(true);
  expect(
    forbidden(
      path.join(studio, "runtime/view.ts"),
      "../../../libs/shared/example",
    ),
  ).toBe(true);
  expect(
    forbidden(
      path.join(studio, "runtime/styles.css"),
      "../../host/styles/fonts.css",
    ),
  ).toBe(true);
  expect(
    forbidden(
      path.join(studio, "runtime/view.ts"),
      "../modules/host/models/page/interface",
    ),
  ).toBe(false);
});

test("Studio code, styles and Storybook configuration do not import production", () => {
  const violations: string[] = [];
  for (const file of files(studio)) {
    if (!/\.(?:[cm]?[jt]sx?|css)$/.test(file)) continue;
    const source = readFileSync(file, "utf8");
    const imports: string[] = [];
    if (file.endsWith(".css")) {
      for (const match of source.matchAll(
        /@(?:import|source)\s+["']([^"']+)["']/g,
      ))
        imports.push(match[1]);
    } else {
      const tree = ts.createSourceFile(
        file,
        source,
        ts.ScriptTarget.Latest,
        true,
      );
      function visit(node: ts.Node) {
        if (
          (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
          node.moduleSpecifier &&
          ts.isStringLiteral(node.moduleSpecifier)
        )
          imports.push(node.moduleSpecifier.text);
        if (
          ts.isImportTypeNode(node) &&
          ts.isLiteralTypeNode(node.argument) &&
          ts.isStringLiteral(node.argument.literal)
        )
          imports.push(node.argument.literal.text);
        if (
          ts.isCallExpression(node) &&
          (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
            node.expression.getText(tree) === "require") &&
          node.arguments[0] &&
          ts.isStringLiteral(node.arguments[0])
        )
          imports.push(node.arguments[0].text);
        ts.forEachChild(node, visit);
      }
      visit(tree);
    }
    for (const specifier of imports)
      if (forbidden(file, specifier))
        violations.push(`${path.relative(root, file)} → ${specifier}`);
  }
  expect(violations).toEqual([]);
});

test("content generation writes only local Studio derivatives", () => {
  const generator = readFileSync(
    path.join(root, "tools/studio/products/publish-ai-chat.ts"),
    "utf8",
  );
  expect(generator).not.toContain("libs/");
  expect(generator).not.toContain("apps/host/");
  expect(generator).toContain("apps/studio/modules/");
});
