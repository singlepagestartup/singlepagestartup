import { readFileSync, readdirSync } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const sourcePattern = /\.[cm]?[jt]sx?$/;
function sourceFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (["node_modules", ".next", "dist", "coverage"].includes(entry.name))
      return [];
    const path = join(directory, entry.name);
    return entry.isDirectory()
      ? sourceFiles(path)
      : sourcePattern.test(path)
        ? [path]
        : [];
  });
}

/** Check the confirmed order, including edges hidden behind shared barrels. */
export function checkModuleDependencies(root) {
  root = resolve(root);
  const contract = readFileSync(
    join(root, ".agents/contracts/engineering/module-dependencies.md"),
    "utf8",
  );
  const order = [...contract.matchAll(/^\d+\. `([^`]+)`$/gm)].map(
    (match) => match[1],
  );
  if (!order.length || new Set(order).size !== order.length)
    throw new Error("Invalid confirmed module order");
  const ranks = new Map(order.map((module, index) => [module, index]));
  const owner = (path) =>
    relative(root, path)
      .replaceAll("\\", "/")
      .match(/^libs\/modules\/([^/]+)\//)?.[1];
  const config = ts.readConfigFile(
    join(root, "tsconfig.base.json"),
    ts.sys.readFile,
  );
  if (config.error)
    throw new Error(
      ts.flattenDiagnosticMessageText(config.error.messageText, "\n"),
    );
  const { options, errors } = ts.convertCompilerOptionsFromJson(
    config.config.compilerOptions ?? {},
    root,
  );
  if (errors.length)
    throw new Error(
      ts.flattenDiagnosticMessageText(errors[0].messageText, "\n"),
    );
  const cache = ts.createModuleResolutionCache(root, (path) => path, options);
  const edges = new Map();
  function imports(path) {
    if (edges.has(path)) return edges.get(path);
    const found = [];
    edges.set(path, found);
    if (!sourcePattern.test(path)) return found;
    const source = ts.createSourceFile(
      path,
      readFileSync(path, "utf8"),
      ts.ScriptTarget.Latest,
      true,
    );
    function visit(node) {
      const specifier =
        ts.isImportDeclaration(node) || ts.isExportDeclaration(node)
          ? node.moduleSpecifier
          : ts.isImportEqualsDeclaration(node) &&
              ts.isExternalModuleReference(node.moduleReference)
            ? node.moduleReference.expression
            : ts.isImportTypeNode(node) && ts.isLiteralTypeNode(node.argument)
              ? node.argument.literal
              : ts.isCallExpression(node) &&
                  (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
                    (ts.isIdentifier(node.expression) &&
                      node.expression.text === "require"))
                ? node.arguments[0]
                : undefined;
      if (specifier && ts.isStringLiteralLike(specifier)) {
        const target = ts.resolveModuleName(
          specifier.text,
          path,
          options,
          ts.sys,
          cache,
        ).resolvedModule?.resolvedFileName;
        if (
          target &&
          !target.includes("/node_modules/") &&
          !relative(root, target).startsWith("..") &&
          !isAbsolute(relative(root, target))
        ) {
          found.push({
            target: resolve(target),
            line:
              source.getLineAndCharacterOfPosition(specifier.getStart(source))
                .line + 1,
            specifier: specifier.text,
          });
        }
      }
      ts.forEachChild(node, visit);
    }
    visit(source);
    return found;
  }
  const violations = [];
  const files = sourceFiles(join(root, "libs/modules"));
  for (const file of files) {
    const sourceOwner = owner(file);
    if (!ranks.has(sourceOwner)) {
      violations.push({
        file: relative(root, file),
        line: 1,
        source: sourceOwner,
        reason: "Module has no confirmed position",
      });
      continue;
    }
    // Stop at another domain boundary: that module's own edges are checked separately.
    const pending = [{ path: file, trace: [] }];
    const seen = new Set([file]);
    while (pending.length) {
      const current = pending.pop();
      for (const edge of imports(current.path)) {
        const targetOwner = owner(edge.target);
        const trace = [
          ...current.trace,
          {
            file: relative(root, current.path),
            line: edge.line,
            specifier: edge.specifier,
          },
        ];
        if (targetOwner && targetOwner !== sourceOwner) {
          if (
            !ranks.has(targetOwner) ||
            ranks.get(targetOwner) < ranks.get(sourceOwner)
          ) {
            violations.push({
              file: relative(root, file),
              line: trace[0].line,
              source: sourceOwner,
              target: targetOwner,
              trace,
            });
          }
          continue;
        }
        // Same-module edges are each checked at their own source; traverse neutral barrels only.
        if (!targetOwner && !seen.has(edge.target)) {
          seen.add(edge.target);
          pending.push({ path: edge.target, trace });
        }
      }
    }
  }
  return { order, files: files.length, violations };
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const result = checkModuleDependencies(
    process.argv[2] ??
      resolve(dirname(fileURLToPath(import.meta.url)), "../.."),
  );
  for (const violation of result.violations)
    console.error(JSON.stringify(violation));
  console.log(
    `Module dependencies: ${result.files} source files, ${result.violations.length} violations.`,
  );
  if (result.violations.length) process.exitCode = 1;
}
