import * as pgCore from "drizzle-orm/pg-core";
import { fields } from "./fields";
import { constraints } from "./constraints";

export const moduleName = "sps_rc";
export const table = "permission";

const pgTable = pgCore.pgTableCreator((name) => `${moduleName}_${name}`);

export const Table = pgTable(
  table,
  {
    ...fields,
  },
  (table) => constraints(table),
);
