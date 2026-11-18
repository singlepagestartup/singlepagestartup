import { readFileSync, readdirSync } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const sourcePattern = /\.[cm]?[jt]sx?$/;
const entityPattern =
  /^libs\/modules\/([^/]+)\/(models|relations)\/([^/]+)\/(.*)$/;
const serviceEntryPattern =
  /^backend\/app\/api\/src\/lib\/service\/(?:(?:singlepage|startup)\/)?index\.[cm]?[jt]s$/;
const bootstrapPattern = /^backend\/app\/api\/src\/lib\/bootstrap\.[cm]?[jt]s$/;
const localModulesPattern =
  /^backend\/app\/api\/src\/lib\/service\/modules\.[cm]?[jt]s$/;

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

function moduleSpecifier(node) {
  if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) {
    return node.moduleSpecifier;
  }
  if (
    ts.isImportEqualsDeclaration(node) &&
    ts.isExternalModuleReference(node.moduleReference)
  ) {
    return node.moduleReference.expression;
  }
  if (ts.isImportTypeNode(node) && ts.isLiteralTypeNode(node.argument)) {
    return node.argument.literal;
  }
  if (
    ts.isCallExpression(node) &&
    (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
      (ts.isIdentifier(node.expression) && node.expression.text === "require"))
  ) {
    return node.arguments[0];
  }
}

function importedBindings(node) {
  if (ts.isImportDeclaration(node) && node.importClause) {
    const { name, namedBindings, isTypeOnly } = node.importClause;
    const bindings = [];
    if (name) {
      bindings.push({ imported: "default", local: name.text, isTypeOnly });
    }
    if (namedBindings && ts.isNamespaceImport(namedBindings)) {
      bindings.push({
        imported: "*",
        local: namedBindings.name.text,
        isTypeOnly,
      });
    }
    if (namedBindings && ts.isNamedImports(namedBindings)) {
      for (const entry of namedBindings.elements) {
        bindings.push({
          imported: (entry.propertyName ?? entry.name).text,
          local: entry.name.text,
          isTypeOnly: isTypeOnly || entry.isTypeOnly,
        });
      }
    }
    return bindings;
  }
  if (ts.isImportEqualsDeclaration(node)) {
    return [
      { imported: "*", local: node.name.text, isTypeOnly: node.isTypeOnly },
    ];
  }
  if (ts.isImportTypeNode(node)) {
    let name = node.qualifier;
    while (name && ts.isQualifiedName(name)) {
      name = name.left;
    }
    return [{ imported: name?.text ?? "*", isTypeOnly: true }];
  }
  if (ts.isCallExpression(node)) {
    const loadsAsync = node.expression.kind === ts.SyntaxKind.ImportKeyword;
    const initializer = ts.isAwaitExpression(node.parent) ? node.parent : node;
    const declaration = initializer.parent;
    if (
      ts.isVariableDeclaration(declaration) &&
      declaration.initializer === initializer
    ) {
      let scope = declaration.parent;
      while (
        !ts.isBlock(scope) &&
        !ts.isModuleBlock(scope) &&
        !ts.isSourceFile(scope)
      ) {
        scope = scope.parent;
      }
      const bounds = { start: scope.pos, end: scope.end };
      if (ts.isIdentifier(declaration.name)) {
        return [
          {
            imported: "*",
            local: declaration.name.text,
            isTypeOnly: false,
            loadsAsync,
            bounds,
          },
        ];
      }
      if (ts.isObjectBindingPattern(declaration.name)) {
        return declaration.name.elements
          .filter((entry) => ts.isIdentifier(entry.name))
          .map((entry) => ({
            imported:
              entry.propertyName && ts.isStringLiteralLike(entry.propertyName)
                ? entry.propertyName.text
                : (entry.propertyName ?? entry.name).getText(),
            local: entry.name.getText(),
            isTypeOnly: false,
            loadsAsync,
            bounds,
          }));
      }
    }
  }

  return [{ imported: "*", isTypeOnly: false }];
}

function exportedBindings(node) {
  const { exportClause, isTypeOnly } = node;
  if (!exportClause || ts.isNamespaceExport(exportClause)) {
    return [
      { imported: "*", exported: exportClause?.name.text ?? "*", isTypeOnly },
    ];
  }
  return exportClause.elements.map((entry) => ({
    imported: (entry.propertyName ?? entry.name).text,
    exported: entry.name.text,
    isTypeOnly: isTypeOnly || entry.isTypeOnly,
  }));
}

function isServiceEntry(path, name) {
  if (bootstrapPattern.test(path)) {
    return name === "*" || name === "createService" || /Bootstrap$/.test(name);
  }
  return serviceEntryPattern.test(path) && (name === "*" || name === "Service");
}

function rememberServiceUse(expression, used) {
  let local = expression;
  let member = "*";
  while (ts.isPropertyAccessExpression(local)) {
    member = local.name.text;
    local = local.expression;
  }
  if (ts.isIdentifier(local)) {
    const references = used.get(local.text) ?? [];
    references.push({ member, position: local.pos });
    used.set(local.text, references);
  }
}

function findServiceUse(node, used) {
  if (ts.isCallExpression(node) || ts.isNewExpression(node)) {
    const { expression } = node;
    rememberServiceUse(expression, used);
    if (
      ts.isPropertyAccessExpression(expression) &&
      expression.name.text === "to" &&
      node.arguments?.[0]
    ) {
      rememberServiceUse(node.arguments[0], used);
    }
  }
  if (
    ts.isExpressionWithTypeArguments(node) &&
    ts.isHeritageClause(node.parent) &&
    node.parent.token === ts.SyntaxKind.ExtendsKeyword &&
    ts.isClassLike(node.parent.parent)
  ) {
    rememberServiceUse(node.expression, used);
  }
}

function serviceCycles(graph) {
  const cycles = [];
  const checked = new Set();
  const ancestry = new Set();

  function visit(entity) {
    for (const [target, edge] of graph.get(entity) ?? []) {
      if (ancestry.has(target)) {
        const path = [...ancestry];
        const start = path.indexOf(target);
        const cycle = [...path.slice(start), target];
        cycles.push({
          file: edge.trace[0].file,
          line: edge.trace[0].line,
          source: entity,
          target,
          reason: "Circular service composition",
          cycle,
          trace: cycle
            .slice(0, -1)
            .flatMap(
              (from, index) => graph.get(from).get(cycle[index + 1]).trace,
            ),
        });
      } else if (!checked.has(target)) {
        ancestry.add(target);
        visit(target);
        ancestry.delete(target);
      }
    }
    checked.add(entity);
  }

  for (const entity of graph.keys()) {
    if (!checked.has(entity)) {
      ancestry.add(entity);
      visit(entity);
      ancestry.delete(entity);
    }
  }
  return cycles;
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
  const workspacePath = (path) => relative(root, path).replaceAll("\\", "/");
  const owner = (path) =>
    workspacePath(path).match(/^libs\/modules\/([^/]+)\//)?.[1];
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
    const localExports = [];
    const used = new Map();
    const ownerPath = workspacePath(path).match(entityPattern)?.[4];
    const trackServiceUse =
      !owner(path) ||
      (ownerPath &&
        (bootstrapPattern.test(ownerPath) ||
          serviceEntryPattern.test(ownerPath) ||
          localModulesPattern.test(ownerPath)));
    function visit(node) {
      const specifier = moduleSpecifier(node);
      if (trackServiceUse) {
        findServiceUse(node, used);
      }
      if (ts.isExportDeclaration(node) && !specifier) {
        localExports.push(...exportedBindings(node));
      }
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
          const reexports = ts.isExportDeclaration(node)
            ? exportedBindings(node)
            : [];
          found.push({
            target: resolve(target),
            line:
              source.getLineAndCharacterOfPosition(specifier.getStart(source))
                .line + 1,
            specifier: specifier.text,
            bindings: reexports.length ? reexports : importedBindings(node),
            reexports,
          });
        }
      }
      ts.forEachChild(node, visit);
    }
    visit(source);
    for (const edge of found) {
      for (const binding of edge.bindings) {
        const references = used.get(binding.local);
        // An import() must resolve before the caller can use the factory.
        // It cannot re-enter synchronous service assembly.
        if (!binding.isTypeOnly && !binding.loadsAsync && references) {
          const members = new Set();
          for (const { member, position } of references) {
            if (
              !binding.bounds ||
              (position >= binding.bounds.start &&
                position < binding.bounds.end)
            ) {
              members.add(binding.imported === "*" ? member : binding.imported);
            }
          }
          binding.serviceUses = members;
        }
        for (const alias of localExports) {
          if (binding.local && binding.local === alias.imported) {
            edge.reexports.push({
              imported: binding.imported,
              exported: alias.exported,
              isTypeOnly: binding.isTypeOnly || alias.isTypeOnly,
            });
          }
        }
      }
    }
    return found;
  }

  function traceStep(file, edge) {
    return {
      file: workspacePath(file),
      line: edge.line,
      specifier: edge.specifier,
    };
  }

  // Keep the imported name when a barrel exports many unrelated entities.
  // Across a re-export, follow the original name and carry type-only status.
  function walkSameModuleReferences(file, module, visitReference) {
    const pending = [];
    function addBindings(edge, trace, composes) {
      for (const binding of edge.bindings) {
        pending.push({
          path: edge.target,
          name: binding.imported,
          composes: false,
          trace,
        });
        if (composes) {
          for (const name of binding.serviceUses ?? []) {
            pending.push({ path: edge.target, name, composes: true, trace });
          }
        }
      }
    }
    for (const edge of imports(file)) {
      addBindings(edge, [traceStep(file, edge)], true);
    }
    const seen = new Set();
    while (pending.length) {
      const current = pending.pop();
      const targetOwner = owner(current.path);
      if (targetOwner && targetOwner !== module) {
        continue;
      }
      const key = `${current.trace[0].line}:${current.path}:${current.name}:${current.composes}`;
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      visitReference(current, workspacePath(current.path).match(entityPattern));

      for (const edge of imports(current.path)) {
        const trace = [...current.trace, traceStep(current.path, edge)];
        if (!targetOwner && !edge.reexports.length) {
          addBindings(edge, trace, current.composes);
        }
        for (const binding of edge.reexports) {
          if (
            current.name === "*" ||
            current.name === binding.exported ||
            (binding.exported === "*" && current.name !== "default")
          ) {
            const name =
              binding.exported === "*" ? current.name : binding.imported;
            pending.push({
              path: edge.target,
              name,
              composes: current.composes && !binding.isTypeOnly,
              trace,
            });
          }
        }
      }
    }
  }

  const violations = [];
  const services = new Map();
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
    const pending = [{ path: file, trace: [] }];
    const seen = new Set([file]);
    while (pending.length) {
      const current = pending.pop();
      for (const edge of imports(current.path)) {
        const targetOwner = owner(edge.target);
        const trace = [...current.trace, traceStep(current.path, edge)];
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
        if (!targetOwner && !seen.has(edge.target)) {
          seen.add(edge.target);
          pending.push({ path: edge.target, trace });
        }
      }
    }

    const entity = workspacePath(file).match(entityPattern);
    if (!entity) {
      continue;
    }
    const [, , kind, name, layerPath] = entity;
    const model = kind === "models" && layerPath.startsWith("backend/app/");
    const composition =
      bootstrapPattern.test(layerPath) ||
      serviceEntryPattern.test(layerPath) ||
      localModulesPattern.test(layerPath);
    if (!model && !composition) {
      continue;
    }
    const source = `${sourceOwner}.${name}`;
    const plural = name.endsWith("y") ? name.slice(0, -1) + "ies" : name + "s";
    const modelNames = new Set([name, plural]);
    const incomingReports = new Set();

    walkSameModuleReferences(file, sourceOwner, (reference, target) => {
      if (!target) {
        return;
      }
      const [, , targetKind, targetName, targetPath] = target;
      const relation = targetName.match(/^(.+)-to-(.+)$/);
      const { trace } = reference;
      const targetEntity = `${sourceOwner}.${targetName}`;
      if (
        model &&
        targetKind === "relations" &&
        relation &&
        modelNames.has(relation[2]) &&
        !modelNames.has(relation[1])
      ) {
        const report = `${trace[0].line}:${targetName}`;
        if (!incomingReports.has(report)) {
          incomingReports.add(report);
          violations.push({
            file: trace[0].file,
            line: trace[0].line,
            source,
            target: targetEntity,
            reason: "Lower model imports its incoming relation",
            trace,
          });
        }
      }
      if (
        composition &&
        reference.composes &&
        targetEntity !== source &&
        isServiceEntry(targetPath, reference.name)
      ) {
        const targets = services.get(source) ?? new Map();
        targets.set(targetEntity, reference);
        services.set(source, targets);
      }
    });
  }
  return {
    order,
    files: files.length,
    violations: [...violations, ...serviceCycles(services)],
  };
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
