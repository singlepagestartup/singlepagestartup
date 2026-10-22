/**
 * BDD Suite: Studio catalog generation.
 * Given: model schemas and authored flat or nested component variants.
 * When: the catalog rebuilds local records and public variant registries.
 * Then: authored variants and startup overrides remain available to consumers.
 */
import { afterEach, expect, test } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
  mkdirSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  assembleEntity,
  fixtureId,
  fixtureRecord,
  readSchemaFields,
  scaffoldEntity,
} from "./catalog";
import { collectModuleInventory, moduleDirectoryPaths } from "./inventory";

const root = path.resolve(import.meta.dir, "../../..");
const temporary: string[] = [];
afterEach(() => {
  for (const directory of temporary.splice(0))
    rmSync(directory, { recursive: true, force: true });
});

test("every native model has a public entry, both layers and local stories; Telegram is excluded", async () => {
  const inventory = await collectModuleInventory();
  expect(inventory.modules.some((module) => module.name === "telegram")).toBe(
    false,
  );
  expect(inventory.totals.entities).toBe(61);
  for (const module of inventory.modules)
    for (const entity of module.entities) {
      expect(entity.entityType).toBe("model");
      const collection = "models";
      const directory = path.join(
        root,
        "apps/studio/modules",
        entity.module,
        entity.entity,
      );
      for (const file of [
        "Component.tsx",
        "index.ts",
        "interface.ts",
        "variants.ts",
        "singlepage/variants.ts",
        "startup/variants.ts",
      ])
        expect(existsSync(path.join(directory, file))).toBe(true);
      expect(entity.storyFiles?.length).toBeGreaterThan(0);
      const fixture = JSON.parse(
        readFileSync(
          path.join(directory, "singlepage/admin-v2-table/data.json"),
          "utf8",
        ),
      );
      const native = path.join(
        root,
        "libs/modules",
        entity.module,
        collection,
        entity.entity,
        "backend/repository/database/src/lib",
      );
      const fields = readSchemaFields(
        existsSync(path.join(native, "fields/startup.ts"))
          ? path.join(native, "fields/startup.ts")
          : path.join(native, "schema.ts"),
      );
      expect(fixture.schema.fields).toEqual(fields);
      for (const record of fixture.records) {
        expect(Object.keys(record)).toEqual(fields.map((field) => field.key));
        for (const field of fields) {
          if (field.target) {
            const target = JSON.parse(
              readFileSync(
                path.join(
                  root,
                  "apps/studio/modules",
                  field.target.module,
                  field.target.entity,
                  "singlepage/admin-v2-table/data.json",
                ),
                "utf8",
              ),
            );
            expect(
              target.records.some(
                (item: { id: string }) => item.id === record[field.key],
              ),
            ).toBe(true);
          }
        }
      }
    }
  expect(
    moduleDirectoryPaths({
      ...inventory,
      modules: [
        { name: "telegram", entities: [inventory.modules[0].entities[0]] },
      ],
    }),
  ).toEqual([]);
}, 30_000);

test("schema reading includes inherited fields, defaults, nullability and vector dimensions", () => {
  const directory = mkdtempSync(path.join(tmpdir(), "studio-schema-"));
  temporary.push(directory);
  writeFileSync(
    path.join(directory, "singlepage.ts"),
    'import * as pgCore from "drizzle-orm/pg-core"; export const fields = { id: pgCore.uuid("id").primaryKey(), title: pgCore.text("title"), orderIndex: pgCore.integer("order_index").notNull().default(0) };',
  );
  writeFileSync(
    path.join(directory, "startup.ts"),
    'import * as pgCore from "drizzle-orm/pg-core"; import { fields as parentFields } from "./singlepage"; import { vector } from "drizzle-orm/pg-core/columns/vector_extension/vector"; export const fields = { ...parentFields, title: pgCore.text("title").notNull().default("owned"), embedding: vector("embedding", {dimensions: 3}).notNull() };',
  );
  const fields = readSchemaFields(path.join(directory, "startup.ts"));
  expect(fields.map((field) => field.key)).toEqual([
    "id",
    "title",
    "orderIndex",
    "embedding",
  ]);
  expect(fields.find((field) => field.key === "title")).toMatchObject({
    nullable: false,
    default: "owned",
  });
  expect(fixtureRecord("example", "model", fields, 1)).toEqual({
    id: fixtureId("example", "model"),
    title: "model example 1",
    orderIndex: 0,
    embedding: [0, 0, 0],
  });
});

test("JSON arrays retain their shape in local records", () => {
  const directory = mkdtempSync(path.join(tmpdir(), "studio-json-"));
  temporary.push(directory);
  const file = path.join(directory, "schema.ts");
  writeFileSync(
    file,
    'import * as pgCore from "drizzle-orm/pg-core"; export const fields = { id: pgCore.uuid("id").primaryKey(), allowedMcpServerIds: pgCore.jsonb("allowed_mcp_server_ids").$type<string[]>().notNull() };',
  );
  const fields = readSchemaFields(file);
  expect(fields[1].jsonShape).toBe("array");
  expect(
    fixtureRecord("social", "profile", fields, 1).allowedMcpServerIds,
  ).toEqual([]);
});

test("assembling keeps variant aliases, startup overrides and authored files", () => {
  const directory = mkdtempSync(path.join(tmpdir(), "studio-entries-"));
  temporary.push(directory);
  for (const layer of ["singlepage", "startup"]) {
    mkdirSync(path.join(directory, layer, "example"), { recursive: true });
    writeFileSync(
      path.join(directory, layer, "example/Component.tsx"),
      'import type { IComponentProps } from "./interface"; export function Component(_props: IComponentProps) { return <p>Owned view</p>; }',
    );
    writeFileSync(
      path.join(directory, layer, "example/interface.ts"),
      'export const variant = "owned-variant"; export interface IComponentProps { variant?: typeof variant }',
    );
    writeFileSync(
      path.join(directory, layer, "variants.ts"),
      'import { Component as Example } from "./example"; export const variants = { "owned-variant": Example };',
    );
  }
  assembleEntity(directory);
  assembleEntity(directory);
  for (const layer of ["singlepage", "startup"]) {
    expect(
      readFileSync(path.join(directory, layer, "variants.ts"), "utf8"),
    ).toContain('"owned-variant": Example');
    expect(
      readFileSync(
        path.join(directory, layer, "example/Component.tsx"),
        "utf8",
      ),
    ).toContain("Owned view");
    expect(
      readFileSync(path.join(directory, layer, "example/index.ts"), "utf8"),
    ).toContain('Component } from "./Component"');
  }
  expect(
    readFileSync(path.join(directory, "variants.ts"), "utf8").indexOf(
      "...startupVariants",
    ),
  ).toBeGreaterThan(
    readFileSync(path.join(directory, "variants.ts"), "utf8").indexOf(
      "...singlepageVariants",
    ),
  );
});

test("reassembling nested variants preserves custom keys and startup rendering", async () => {
  const directory = mkdtempSync(path.join(tmpdir(), "studio-nested-entries-"));
  temporary.push(directory);
  for (const layer of ["singlepage", "startup"]) {
    const selector = path.join(directory, layer, "agent/select/ai-chat");
    mkdirSync(selector, { recursive: true });
    writeFileSync(
      path.join(selector, "Component.tsx"),
      `import type { IComponentProps } from "./interface"; export function Component(_props: IComponentProps) { return ${JSON.stringify(layer)}; }`,
    );
    writeFileSync(
      path.join(selector, "interface.ts"),
      'export const variant = "choose-agent"; export interface IComponentProps { variant?: typeof variant }',
    );
    writeFileSync(
      path.join(directory, layer, "variants.ts"),
      'import { Component as Selector } from "./agent/select/ai-chat/Component.tsx"; export const variants = { "choose-agent": Selector };',
    );
  }
  const sidebar = path.join(directory, "singlepage/sidebar/ai-chat/project");
  mkdirSync(sidebar, { recursive: true });
  writeFileSync(
    path.join(sidebar, "Component.tsx"),
    'export function Component() { return "project sidebar"; }',
  );
  writeFileSync(
    path.join(sidebar, "interface.ts"),
    'export const variant = "sidebar-ai-chat-project"; export interface IComponentProps { variant?: typeof variant }',
  );
  for (let iteration = 0; iteration < 2; iteration++) {
    assembleEntity(directory);
    const { variants } = await import(
      path.join(directory, "variants.ts") + `?iteration=${iteration}`
    );
    expect(Object.keys(variants).sort()).toEqual([
      "choose-agent",
      "sidebar-ai-chat-project",
    ]);
    expect(renderToStaticMarkup(createElement(variants["choose-agent"]))).toBe(
      "startup",
    );
    expect(
      renderToStaticMarkup(createElement(variants["sidebar-ai-chat-project"])),
    ).toBe("project sidebar");
  }
});

test("scaffolding preserves authored data and UI and skips relations and Telegram", async () => {
  const directory = mkdtempSync(path.join(tmpdir(), "studio-catalog-"));
  temporary.push(directory);
  const inventory = await collectModuleInventory();
  const entity = inventory.modules.find((module) => module.name === "analytic")!
    .entities[0];
  const native = path.join(
    directory,
    "libs/modules",
    entity.module,
    "models",
    entity.entity,
    "backend/repository/database/src/lib",
  );
  mkdirSync(native, { recursive: true });
  writeFileSync(
    path.join(native, "schema.ts"),
    'import * as pgCore from "drizzle-orm/pg-core"; export const Table = pgCore.pgTable("metric", { id: pgCore.uuid("id").primaryKey(), variant: pgCore.text("variant").notNull().default("default") });',
  );
  scaffoldEntity(directory, entity);
  const table = path.join(
    directory,
    "apps/studio/modules",
    entity.module,
    entity.entity,
    "singlepage/admin-v2-table",
  );
  writeFileSync(path.join(table, "data.json"), '{"owned": true}');
  writeFileSync(
    path.join(table, "Component.tsx"),
    "export function Component() { return <p>Owned records</p>; }",
  );
  scaffoldEntity(directory, entity);
  expect(
    existsSync(
      path.join(directory, "apps/studio/modules", entity.module, "models"),
    ),
  ).toBe(false);
  expect(readFileSync(path.join(table, "data.json"), "utf8")).toBe(
    '{"owned": true}',
  );
  expect(readFileSync(path.join(table, "Component.tsx"), "utf8")).toContain(
    "Owned records",
  );
  expect(existsSync(path.join(table, "../list"))).toBe(false);
  const widgetEntity = { ...entity, entity: "widget" };
  const widgetNative = path.join(
    directory,
    "libs/modules",
    entity.module,
    "models/widget/backend/repository/database/src/lib",
  );
  mkdirSync(widgetNative, { recursive: true });
  writeFileSync(
    path.join(widgetNative, "schema.ts"),
    readFileSync(path.join(native, "schema.ts"), "utf8"),
  );
  scaffoldEntity(directory, widgetEntity);
  const listStory = readFileSync(
    path.join(
      directory,
      "apps/studio/modules",
      entity.module,
      "widget/singlepage/list/Component.stories.tsx",
    ),
    "utf8",
  );
  expect(listStory).toContain("count: { control:");
  expect(listStory).toContain(
    'title: "Modules/Analytic/Widget/Singlepage/list"',
  );
  const model = path.dirname(path.dirname(table));
  const own = path.join(model, "singlepage/owned-list");
  mkdirSync(own, { recursive: true });
  writeFileSync(
    path.join(own, "Component.tsx"),
    "export function Component() { return <p>Owned list</p>; }",
  );
  rmSync(path.join(model, "singlepage/list"), { recursive: true, force: true });
  writeFileSync(
    path.join(own, "interface.ts"),
    'export const variant = "list"; export interface IComponentProps { variant?: typeof variant }',
  );
  writeFileSync(
    path.join(model, "singlepage/variants.ts"),
    'import { Component as Owned } from "./owned-list/Component"; export const variants = { "list": Owned };',
  );
  scaffoldEntity(directory, entity);
  expect(existsSync(path.join(model, "singlepage/list"))).toBe(false);
  expect(
    readFileSync(path.join(model, "singlepage/variants.ts"), "utf8"),
  ).toContain('"list":');
  scaffoldEntity(directory, {
    ...entity,
    entityType: "relation",
    entity: "ignored-relation",
  });
  expect(
    existsSync(
      path.join(directory, "apps/studio/modules", entity.module, "relations"),
    ),
  ).toBe(false);
  expect(existsSync(path.join(table, "../find"))).toBe(false);
  scaffoldEntity(directory, { ...entity, module: "telegram" });
  expect(existsSync(path.join(directory, "apps/studio/modules/telegram"))).toBe(
    false,
  );
});
