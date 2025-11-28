import * as pgCore from "drizzle-orm/pg-core";
import { fields } from "./fields";

export const moduleName = "rc";
export const table = "action";

const pgTable = pgCore.pgTableCreator((name) => `${moduleName}_${name}`);

export const Table = pgTable(table, {
  ...fields,
});
