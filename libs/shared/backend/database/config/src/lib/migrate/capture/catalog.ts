import { getTableColumns } from "drizzle-orm";
import { getTableConfig, type PgTable } from "drizzle-orm/pg-core";
import { glob } from "node:fs/promises";
import { existsSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";

export interface ICaptureResource {
  resource: string;
  topic: string;
  columns: Record<string, string>;
}

export function assertCaptureTable(schemaPath: string, table: PgTable) {
  const entity = resolve(dirname(schemaPath), "../../../../..");
  const config = getTableConfig(table);
  if (basename(dirname(entity)) === "models" && config.foreignKeys.length) {
    const referenced = getTableConfig(
      config.foreignKeys[0].reference().foreignTable,
    );
    throw new Error(
      `${schemaPath}: move the foreign key from ${config.name} to ${referenced.name} into a relation`,
    );
  }
}

export async function readCaptureResource(
  schemaPath: string,
  table: PgTable,
): Promise<ICaptureResource> {
  assertCaptureTable(schemaPath, table);
  const entity = resolve(dirname(schemaPath), "../../../../..");
  const config = getTableConfig(table);
  const { route } = await import(join(entity, "sdk/model/index.ts"));
  if (typeof route !== "string" || !route.startsWith("/api/")) {
    throw new Error(`Missing SDK route: ${entity}`);
  }
  return {
    resource: `${config.schema || "public"}.${config.name}`,
    topic: route.slice(5).replaceAll("/", "."),
    columns: Object.fromEntries(
      Object.entries(getTableColumns(table)).map(([key, column]) => [
        key,
        column.name,
      ]),
    ),
  };
}

export async function readCaptureCatalog(): Promise<ICaptureResource[]> {
  // API and migration commands also run from entity folders inside the Nx workspace.
  let workspace = process.cwd();
  while (!existsSync(join(workspace, "nx.json"))) {
    const parent = dirname(workspace);
    if (parent === workspace) {
      throw new Error("Run the consistency check inside the project workspace");
    }
    workspace = parent;
  }
  const modules = join(workspace, "libs/modules");
  const resources = new Map<string, ICaptureResource>();
  for await (const file of glob(
    "*/{models,relations}/*/backend/repository/database/src/lib/schema.ts",
    { cwd: modules },
  )) {
    const path = join(modules, file);
    const { Table } = await import(path);
    if (!Table) {
      continue;
    }
    const entry = await readCaptureResource(path, Table);
    if (resources.has(entry.resource)) {
      throw new Error(`Duplicate physical resource: ${entry.resource}`);
    }
    resources.set(entry.resource, entry);
  }
  if (!resources.size) {
    throw new Error(`No model or relation schemas found in ${modules}`);
  }
  return [...resources.values()].sort((a, b) =>
    a.resource.localeCompare(b.resource),
  );
}
