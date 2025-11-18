import * as pgCore from "drizzle-orm/pg-core";
import { fields } from "./fields";

export const moduleName = "sl";
export const table = "tread";

const pgTable = pgCore.pgTableCreator((name) => `${moduleName}_${name}`);

export const Table = pgTable(table, {
  ...fields,
});
