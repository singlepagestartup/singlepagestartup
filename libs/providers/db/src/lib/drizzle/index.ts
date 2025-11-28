import * as drizzleSchema from "./schema";
import { getDrizzle } from "@sps/shared-backend-database-config";
import path from "path";

export { migrate } from "./migrate";
export { seed } from "./seed";
export { drop } from "./drop";
export const db = getDrizzle({ schema: drizzleSchema });
export const schema = drizzleSchema;

const modulesSchemaPaths = [
  path.resolve(__dirname, "./schema.ts"),
  path.resolve(__dirname, "./startup.ts"),
];

export const schemaPath = modulesSchemaPaths;
