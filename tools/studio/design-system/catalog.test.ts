import { afterEach, expect, test } from "bun:test";
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

test("every native entity has a public entry, both layers and local stories; Telegram is excluded", async () => {
  const inventory = await collectModuleInventory();
  expect(inventory.modules.some((module) => module.name === "telegram")).toBe(
    false,
  );
  expect(inventory.totals.entities).toBe(153);
  for (const module of inventory.modules)
    for (const entity of module.entities) {
      const collection = entity.entityType === "model" ? "models" : "relations";
      const directory = path.join(
        root,
        "apps/studio/modules",
        entity.module,
        collection,
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
                  "models",
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
});

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
      "export function Example() { return <p>Owned view</p>; }",
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
    ).toContain("Example as Component");
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

test("scaffolding preserves authored data and UI and skips Telegram", async () => {
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
    "models",
    entity.entity,
    "singlepage/admin-v2-table",
  );
  writeFileSync(path.join(table, "data.json"), '{"owned": true}');
  writeFileSync(
    path.join(table, "Component.tsx"),
    "export function Component() { return <p>Owned records</p>; }",
  );
  scaffoldEntity(directory, entity);
  expect(readFileSync(path.join(table, "data.json"), "utf8")).toBe(
    '{"owned": true}',
  );
  expect(readFileSync(path.join(table, "Component.tsx"), "utf8")).toContain(
    "Owned records",
  );
  scaffoldEntity(directory, { ...entity, module: "telegram" });
  expect(existsSync(path.join(directory, "apps/studio/modules/telegram"))).toBe(
    false,
  );
});
