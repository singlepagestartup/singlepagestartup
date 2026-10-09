import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import ts from "typescript";
import {
  collectModuleInventory,
  EXCLUDED_MODULES,
  type ModuleEntityRecord,
} from "./inventory";

export interface CatalogField {
  key: string;
  label: string;
  kind: string;
  nullable: boolean;
  dimensions?: number;
  jsonShape?: "array";
  default?: unknown;
  target?: { module: string; entity: string };
}

function tree(file: string) {
  return ts.createSourceFile(
    file,
    readFileSync(file, "utf8"),
    ts.ScriptTarget.Latest,
    true,
  );
}

function literal(node: ts.Expression | undefined): unknown {
  if (!node) return undefined;
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node))
    return node.text;
  if (ts.isNumericLiteral(node)) return Number(node.text);
  if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
  if (node.kind === ts.SyntaxKind.NullKeyword) return null;
  if (ts.isPrefixUnaryExpression(node) && ts.isNumericLiteral(node.operand))
    return -Number(node.operand.text);
  if (ts.isArrayLiteralExpression(node))
    return node.elements.map((item) => literal(item as ts.Expression));
  if (ts.isObjectLiteralExpression(node))
    return Object.fromEntries(
      node.properties
        .filter(ts.isPropertyAssignment)
        .map((item) => [
          item.name.getText().replace(/^['"]|['"]$/g, ""),
          literal(item.initializer),
        ]),
    );
  return undefined;
}

/** Read syntax only. Production schema modules are never evaluated or imported. */
export function readSchemaFields(
  file: string,
  active = new Set<string>(),
): CatalogField[] {
  if (active.has(file)) throw new Error(`Circular schema fields: ${file}`);
  active.add(file);
  const source = tree(file);
  const imports = new Map<string, string>();
  for (const node of source.statements) {
    if (
      !ts.isImportDeclaration(node) ||
      !ts.isStringLiteral(node.moduleSpecifier)
    )
      continue;
    const bindings = node.importClause?.namedBindings;
    if (bindings && ts.isNamedImports(bindings))
      for (const item of bindings.elements)
        imports.set(item.name.text, node.moduleSpecifier.text);
  }
  let object: ts.ObjectLiteralExpression | undefined;
  for (const node of source.statements) {
    if (!ts.isVariableStatement(node)) continue;
    for (const declaration of node.declarationList.declarations) {
      if (!ts.isIdentifier(declaration.name) || !declaration.initializer)
        continue;
      if (
        declaration.name.text === "fields" &&
        ts.isObjectLiteralExpression(declaration.initializer)
      )
        object = declaration.initializer;
      if (
        declaration.name.text === "Table" &&
        ts.isCallExpression(declaration.initializer)
      ) {
        const candidate = declaration.initializer.arguments[1];
        if (candidate && ts.isObjectLiteralExpression(candidate))
          object = candidate;
      }
    }
  }
  if (!object) throw new Error(`No schema fields in ${file}`);
  const fields = new Map<string, CatalogField>();
  for (const property of object.properties) {
    if (ts.isSpreadAssignment(property)) {
      const specifier = imports.get(property.expression.getText(source));
      if (!specifier?.startsWith("."))
        throw new Error(
          `Unsupported schema spread in ${file}: ${property.getText(source)}`,
        );
      const base = path.resolve(path.dirname(file), specifier);
      const parent = [base + ".ts", path.join(base, "index.ts")].find(
        existsSync,
      );
      if (!parent) throw new Error(`Missing fields ${base}`);
      for (const field of readSchemaFields(parent, active))
        fields.set(field.key, field);
      continue;
    }
    if (!ts.isPropertyAssignment(property)) continue;
    const key = property.name.getText(source).replace(/^['"]|['"]$/g, "");
    const calls: ts.CallExpression[] = [];
    function visit(node: ts.Node) {
      if (ts.isCallExpression(node)) calls.push(node);
      ts.forEachChild(node, visit);
    }
    visit(property.initializer);
    const column = calls.find(
      (call) =>
        (ts.isPropertyAccessExpression(call.expression) &&
          call.expression.expression.getText(source) === "pgCore") ||
        (ts.isIdentifier(call.expression) &&
          imports
            .get(call.expression.text)
            ?.startsWith("drizzle-orm/pg-core/columns/")),
    );
    if (!column) throw new Error(`Unsupported column ${key} in ${file}`);
    const method = (name: string) =>
      calls.find(
        (call) =>
          ts.isPropertyAccessExpression(call.expression) &&
          call.expression.name.text === name,
      );
    const kind = ts.isPropertyAccessExpression(column.expression)
      ? column.expression.name.text
      : column.expression.getText(source);
    const field: CatalogField = {
      key,
      label: key
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .replace(/^./, (letter) => letter.toUpperCase()),
      kind: method("array") ? `${kind}[]` : kind,
      nullable: !method("notNull") && !method("primaryKey"),
    };
    const value = literal(method("default")?.arguments[0]);
    const jsonType = method("$type")?.typeArguments?.[0]?.getText(source) ?? "";
    const jsonDefault = method("default")?.arguments[0]?.getText(source) ?? "";
    if (
      ["json", "jsonb"].includes(kind) &&
      (/\[\]\s*$|^Array</.test(jsonType) ||
        /'\[\]'::jsonb/.test(jsonDefault) ||
        Array.isArray(value))
    )
      field.jsonShape = "array";
    if (kind === "vector")
      field.dimensions = (
        literal(column.arguments[1]) as { dimensions: number }
      ).dimensions;
    if (value !== undefined) field.default = value;
    const reference = method("references")
      ?.arguments[0]?.getText(source)
      .match(/(?:=>\s*)(\w+)\.id/);
    const target =
      reference &&
      imports
        .get(reference[1])
        ?.match(/^@sps\/([^/]+)\/models\/([^/]+)\/backend/);
    if (target) field.target = { module: target[1], entity: target[2] };
    fields.set(key, field);
  }
  active.delete(file);
  return [...fields.values()];
}

export function fixtureId(module: string, entity: string, index = 1): string {
  const hash = createHash("sha256")
    .update(`studio:${module}:${entity}:${index}`)
    .digest("hex");
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-a${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
}

export function fixtureRecord(
  module: string,
  entity: string,
  fields: CatalogField[],
  index: number,
) {
  return Object.fromEntries(
    fields.map((field) => {
      let value: unknown;
      if (field.key === "id") value = fixtureId(module, entity, index);
      else if (field.target)
        value = fixtureId(field.target.module, field.target.entity, index);
      else if (field.key === "orderIndex") value = index - 1;
      else if (field.kind === "vector")
        value = Array.from({ length: field.dimensions ?? 0 }, () => 0);
      else if (field.kind.endsWith("[]") || field.jsonShape === "array")
        value = field.default ?? [];
      else if (["timestamp", "date"].includes(field.kind))
        value = field.nullable ? null : "2026-01-01T00:00:00.000Z";
      else if (["jsonb", "json"].includes(field.kind))
        value = [
          "title",
          "subtitle",
          "description",
          "shortDescription",
        ].includes(field.key)
          ? { en: `${entity} example ${index}` }
          : (field.default ?? {});
      else if (field.key === "adminTitle" || field.key === "title")
        value = `${entity} example ${index}`;
      else if (field.key === "slug") value = `${entity}-example-${index}`;
      else if (field.default !== undefined) value = field.default;
      else if (field.nullable) value = null;
      else if (
        [
          "integer",
          "smallint",
          "bigint",
          "serial",
          "bigserial",
          "real",
          "doublePrecision",
          "numeric",
          "decimal",
        ].includes(field.kind)
      )
        value = index;
      else if (field.kind === "boolean") value = false;
      else if (field.kind === "uuid")
        value = fixtureId(module, `${entity}-${field.key}`, index);
      else value = `${field.label} example ${index}`;
      return [field.key, value];
    }),
  );
}

function relative(from: string, target: string) {
  const value = path.relative(from, target).split(path.sep).join("/");
  return value.startsWith(".") ? value : `./${value}`;
}

function write(file: string, content: string, preserve = false) {
  if (preserve && existsSync(file)) return;
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, content.endsWith("\n") ? content : content + "\n");
}

function exportedComponent(file: string): string {
  const source = tree(file);
  const names: string[] = [];
  for (const node of source.statements) {
    if (
      !ts.canHaveModifiers(node) ||
      !ts
        .getModifiers(node)
        ?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)
    )
      continue;
    if (ts.isFunctionDeclaration(node) && node.name) names.push(node.name.text);
    if (ts.isVariableStatement(node))
      for (const declaration of node.declarationList.declarations)
        if (ts.isIdentifier(declaration.name))
          names.push(declaration.name.text);
  }
  const name =
    names.find((name) => name === "Component") ??
    names.find((name) => /^[A-Z]/.test(name));
  if (!name) throw new Error(`No exported component in ${file}`);
  return name;
}

export function assembleEntity(directory: string) {
  for (const layer of ["singlepage", "startup"]) {
    const layerDirectory = path.join(directory, layer);
    mkdirSync(layerDirectory, { recursive: true });
    const imports: string[] = [];
    const entries: string[] = [];
    const aliases = variantAliases(path.join(layerDirectory, "variants.ts"));
    for (const variant of readdirSync(layerDirectory, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort()) {
      const component = path.join(layerDirectory, variant, "Component.tsx");
      if (!existsSync(component)) continue;
      const name = exportedComponent(component);
      const index = path.join(path.dirname(component), "index.ts");
      if (!existsSync(index))
        write(
          index,
          `export { ${name}${name === "Component" ? "" : " as Component"} } from "./Component";`,
        );
      else if (
        name !== "Component" &&
        !/\b(?:as\s+)?Component\b/.test(readFileSync(index, "utf8"))
      )
        write(
          index,
          readFileSync(index, "utf8") +
            `\nexport { ${name} as Component } from "./Component";\n`,
        );
      const alias = pascal(variant).replace(/[^a-zA-Z0-9_$]/g, "");
      imports.push(
        `import { Component as ${alias} } from "./${variant}/index";`,
      );
      const keys = [...aliases]
        .filter(([, folder]) => folder === variant)
        .map(([key]) => key);
      for (const key of keys.length ? keys : [variant])
        entries.push(`  ${JSON.stringify(key)}: ${alias},`);
    }
    write(
      path.join(layerDirectory, "variants.ts"),
      `${imports.join("\n")}\n\nexport const variants = {\n${entries.join("\n")}\n};`,
    );
  }
  write(
    path.join(directory, "variants.ts"),
    'import { variants as singlepageVariants } from "./singlepage/variants";\nimport { variants as startupVariants } from "./startup/variants";\n\nexport const variants = {\n  ...singlepageVariants,\n  ...startupVariants,\n};',
  );
  write(
    path.join(directory, "Component.tsx"),
    'import type { ComponentProps, ComponentType } from "react";\nimport { variants } from "./variants";\n\nexport type IComponentProps = {\n  [Variant in keyof typeof variants]: { variant: Variant } & ComponentProps<(typeof variants)[Variant]>;\n}[keyof typeof variants];\n\nexport function Component(props: IComponentProps) {\n  const Comp = variants[props.variant] as ComponentType<IComponentProps>;\n  if (!Comp) return <></>;\n  return <Comp {...props} />;\n}',
  );
  write(
    path.join(directory, "index.ts"),
    'export { Component, type IComponentProps } from "./Component";',
    true,
  );
}

function variantAliases(file: string): Map<string, string> {
  if (!existsSync(file)) return new Map();
  const source = tree(file);
  const imports = new Map<string, string>();
  for (const node of source.statements) {
    if (
      !ts.isImportDeclaration(node) ||
      !ts.isStringLiteral(node.moduleSpecifier)
    )
      continue;
    const folder = node.moduleSpecifier.text.match(
      /^\.\/([^/]+)(?:\/(?:index|Component)(?:\.tsx?)?)?$/,
    )?.[1];
    const bindings = node.importClause?.namedBindings;
    if (folder && bindings && ts.isNamedImports(bindings))
      for (const item of bindings.elements) imports.set(item.name.text, folder);
  }
  const aliases = new Map<string, string>();
  for (const node of source.statements) {
    if (!ts.isVariableStatement(node)) continue;
    for (const declaration of node.declarationList.declarations) {
      if (
        !declaration.initializer ||
        !ts.isObjectLiteralExpression(declaration.initializer)
      )
        continue;
      for (const property of declaration.initializer.properties) {
        if (!ts.isPropertyAssignment(property)) continue;
        const folder = imports.get(property.initializer.getText(source));
        if (folder)
          aliases.set(
            property.name.getText(source).replace(/^['"]|['"]$/g, ""),
            folder,
          );
      }
    }
  }
  return aliases;
}

function metadata(
  root: string,
  folder: string,
  entity: ModuleEntityRecord,
  variant: string,
) {
  const id = `${entity.module}.${entity.entity}.${variant}`;
  const componentName = `${entity.module}.${entity.entity}`;
  const figma = {
    componentName,
    pageName: entity.module,
    variantName: variant,
    nodeId: null,
    variantNodeId: null,
  };
  write(
    path.join(folder, "block.manifest.json"),
    JSON.stringify(
      {
        id,
        title: `${entity.module} ${entity.entity} / ${variant}`,
        description: "Local records for Studio component design.",
        layer: "singlepage",
        state: "draft",
        source: {
          module: entity.module,
          entityType: entity.entityType,
          entity: entity.entity,
          variant,
        },
        files: { component: "Component.tsx", story: "Component.stories.tsx" },
        contentSlots: [],
        figma: {
          ...figma,
          syncStatus: "not-created",
          metadataFile: "figma.json",
        },
      },
      null,
      2,
    ),
    true,
  );
  write(
    path.join(folder, "figma.json"),
    JSON.stringify(
      {
        ...figma,
        metadata: {
          "singlepagestartup.studio.blockId": id,
          "singlepagestartup.studio.layer": "singlepage",
          "singlepagestartup.studio.syncKey": path
            .relative(path.join(root, "apps/studio/modules"), folder)
            .split(path.sep)
            .join("/"),
          "sps.figma.component": componentName,
          "sps.figma.variant": variant,
          "sps.source.module": entity.module,
          "sps.source.entityType": entity.entityType,
          "sps.source.entity": entity.entity,
          "sps.source.variant": variant,
          "sps.contractVersion": "0.1.0",
          "sps.code.component": path
            .relative(root, path.join(folder, "Component.tsx"))
            .split(path.sep)
            .join("/"),
          "sps.code.story": path
            .relative(root, path.join(folder, "Component.stories.tsx"))
            .split(path.sep)
            .join("/"),
        },
      },
      null,
      2,
    ),
    true,
  );
}

function pascal(value: string) {
  return value
    .split("-")
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join("");
}

export function scaffoldEntity(root: string, entity: ModuleEntityRecord) {
  if (EXCLUDED_MODULES.has(entity.module)) return;
  const collection = entity.entityType === "model" ? "models" : "relations";
  const directory = path.join(
    root,
    "apps/studio/modules",
    entity.module,
    collection,
    entity.entity,
  );
  const nativeRoot = path.join(
    root,
    "libs/modules",
    entity.module,
    collection,
    entity.entity,
    "backend/repository/database/src/lib",
  );
  const fieldsFile = path.join(nativeRoot, "fields/startup.ts");
  const fields = readSchemaFields(
    existsSync(fieldsFile) ? fieldsFile : path.join(nativeRoot, "schema.ts"),
  );
  const table = path.join(directory, "singlepage/admin-v2-table");
  const records = [1, 2, 3].map((index) =>
    fixtureRecord(entity.module, entity.entity, fields, index),
  );
  const schema = {
    module: entity.module,
    entity: entity.entity,
    entityType: entity.entityType,
    fields,
  };
  write(
    path.join(table, "data.json"),
    JSON.stringify({ schema, records }, null, 2),
    true,
  );
  const fieldType = (field: CatalogField) => {
    const kind = field.kind.replace(/\[\]$/, "");
    const type =
      kind === "vector"
        ? "number[]"
        : ["json", "jsonb"].includes(kind)
          ? field.jsonShape === "array"
            ? "JsonValue[]"
            : "JsonValue"
          : [
                "integer",
                "smallint",
                "bigint",
                "serial",
                "bigserial",
                "real",
                "doublePrecision",
                "numeric",
                "decimal",
              ].includes(kind)
            ? "number"
            : kind === "boolean"
              ? "boolean"
              : "string";
    return `${field.kind.endsWith("[]") ? `Array<${type}>` : type}${field.nullable ? " | null" : ""}`;
  };
  write(
    path.join(table, "interface.ts"),
    `export type JsonValue = null | string | number | boolean | JsonValue[] | { [key: string]: JsonValue };\n\nexport interface IRecord {\n${fields.map((field) => `  ${field.key}: ${fieldType(field)};`).join("\n")}\n}`,
    true,
  );
  write(
    path.join(directory, "interface.ts"),
    'export type { IRecord as IModel } from "./singlepage/admin-v2-table/interface";',
    true,
  );
  const ui = path.join(
    root,
    "apps/studio/workspace/design/singlepage/interface-kit/RecordProjection",
  );
  const alias =
    entity.entityType === "model"
      ? `${pascal(entity.module)}Module${pascal(entity.entity)}`
      : pascal(entity.entity);
  const existing = variantAliases(
    path.join(directory, "singlepage/variants.ts"),
  );
  for (const variant of (entity.entityType === "model"
    ? ["admin-v2-table", "admin-v2-card", "find"]
    : ["admin-v2-table", "find"]
  ).filter(
    (variant) => !existing.has(variant) || existing.get(variant) === variant,
  )) {
    const folder = path.join(directory, "singlepage", variant);
    const uiImport = relative(folder, ui);
    const dataImport = relative(folder, path.join(table, "data.json"));
    const interfaceImport = relative(folder, path.join(table, "interface"));
    const code =
      variant === "admin-v2-table"
        ? `import { RecordTable } from "${uiImport}";\nimport fixture from "${dataImport}";\nimport type { IRecord } from "${interfaceImport}";\n\nexport function Component() {\n  return <RecordTable<IRecord> schema={fixture.schema} data={fixture.records} />;\n}`
        : variant === "admin-v2-card"
          ? `import { RecordCard, type IProjectionProps } from "${uiImport}";\nimport fixture from "${dataImport}";\nimport type { IRecord } from "${interfaceImport}";\n\nexport interface IComponentProps extends IProjectionProps<IRecord> {}\n\nexport function Component({ data, id, className }: IComponentProps) {\n  const record = data ?? (id ? fixture.records.find((item) => item.id === id) : fixture.records[0]);\n  if (!record) return <p>Record unavailable in this local preview.</p>;\n  return <RecordCard schema={fixture.schema} data={record} className={className} />;\n}`
          : `import { RecordFind, type IProjectionFindProps } from "${uiImport}";\nimport fixture from "${dataImport}";\nimport type { IRecord } from "${interfaceImport}";\n\nexport interface IComponentProps extends IProjectionFindProps<IRecord> {}\n\nexport function Component(props: IComponentProps) {\n  return <RecordFind<IRecord> schema={fixture.schema} records={fixture.records} {...props} />;\n}`;
    write(path.join(folder, "Component.tsx"), code, true);
    write(
      path.join(folder, "index.ts"),
      `export { Component } from "./Component";`,
      true,
    );
    const filterKey = fields.find((field) => field.target)?.key ?? "id";
    const title = (value: string) =>
      value
        .split("-")
        .map((part) => part[0].toUpperCase() + part.slice(1))
        .join("-");
    const moduleTitle =
      entity.module === "crm"
        ? "CRM"
        : entity.module === "rbac"
          ? "RBAC"
          : title(entity.module);
    const storyTitle = `Modules/${moduleTitle}/${entity.entityType === "model" ? "Models" : "Relations"}/${title(entity.entity)}/Singlepage/${variant}`;
    write(
      path.join(folder, "Component.stories.tsx"),
      `import type { Meta, StoryObj } from "@storybook/react-vite";\nimport { Component as ${alias} } from "../../index";\n${variant === "find" || variant === "admin-v2-card" ? `import fixture from "${dataImport}";\n` : ""}\nconst meta = {\n  title: ${JSON.stringify(storyTitle)},\n  component: ${alias},\n  args: { variant: ${JSON.stringify(variant)}${variant === "admin-v2-card" ? ", id: fixture.records[0].id" : ""} },\n${variant === "admin-v2-card" ? '  argTypes: { id: { control: "text" } },\n' : ""}} satisfies Meta<typeof ${alias}>;\nexport default meta;\ntype Story = StoryObj<typeof meta>;\nexport const Default: Story = {};\n${variant === "find" ? `export const Filtered: Story = { args: { apiProps: { params: { filters: { and: [{ column: ${JSON.stringify(filterKey)}, method: "eq", value: fixture.records[0].${filterKey} }] } } } } };\nexport const Empty: Story = { args: { apiProps: { params: { filters: { and: [{ column: "id", method: "eq", value: "missing" }] } } } } };\n` : ""}`,
      true,
    );
    metadata(root, folder, entity, variant);
  }
  assembleEntity(directory);
}

export async function generateCatalog(root = process.cwd()) {
  const inventory = await collectModuleInventory();
  for (const module of inventory.modules)
    for (const entity of module.entities) scaffoldEntity(root, entity);
  // Existing Studio-only visual models retain their own variants and public entries.
  for (const module of readdirSync(path.join(root, "apps/studio/modules"))) {
    if (EXCLUDED_MODULES.has(module)) continue;
    for (const kind of ["models", "relations"]) {
      const collection = path.join(root, "apps/studio/modules", module, kind);
      if (!existsSync(collection)) continue;
      for (const entity of readdirSync(collection)) {
        const directory = path.join(collection, entity);
        if (
          existsSync(path.join(directory, "singlepage")) &&
          readdirSync(path.join(directory, "singlepage"), {
            withFileTypes: true,
          }).some(
            (entry) =>
              entry.isDirectory() &&
              existsSync(
                path.join(directory, "singlepage", entry.name, "Component.tsx"),
              ),
          )
        )
          assembleEntity(directory);
      }
    }
  }
  console.log(
    `Studio catalog: ${inventory.totals.entities} entities; existing views and fixtures preserved.`,
  );
}

if (import.meta.main) await generateCatalog();
