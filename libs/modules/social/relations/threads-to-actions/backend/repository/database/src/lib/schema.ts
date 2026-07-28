import * as pgCore from "drizzle-orm/pg-core";
import { constraints } from "./constraints";
import { fields } from "./fields";

export const moduleName = "sl";
export const table = "ts_to_as_4vv";

const pgTable = pgCore.pgTableCreator((name) => `${moduleName}_${name}`);

export const Table = pgTable(table, { ...fields }, (table) =>
  constraints(table),
);
