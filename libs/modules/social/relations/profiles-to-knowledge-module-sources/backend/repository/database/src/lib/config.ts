import { MigrateConfig } from "@sps/shared-backend-database-config";
import path from "path";
import { cwd } from "process";
import { moduleName, table } from "./schema";
import * as schema from "./schema";

const schemaPaths = [path.resolve(cwd(), __dirname, "./schema.ts")];
const migrationsFolder = path.resolve(cwd(), __dirname, "./migrations");

export const migrate = new MigrateConfig({
  schemaPaths,
  migrationsFolder,
  migrationsTable: `${moduleName}_${table}`,
  schema,
});

export const config = migrate.config();

export default config;
