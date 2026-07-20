import * as pgCore from "drizzle-orm/pg-core";
import { constraints } from "./constraints";
import { fields } from "./fields";

export const moduleName = "sps_rc";
export const table = "rs_to_ps_mz2";

const pgTable = pgCore.pgTableCreator((name) => `${moduleName}_${name}`);

export const Table = pgTable(
  table,
  {
    ...fields,
  },
  (table) => constraints(table),
);
