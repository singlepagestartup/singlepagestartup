import * as pgCore from "drizzle-orm/pg-core";
import { fields } from "./fields";

export const moduleName = "sps_h";
export const table = "page";

const pgTable = pgCore.pgTableCreator((name) => `${moduleName}_${name}`);

export const Table = pgTable(
  table,
  {
    ...fields,
  },
  (table) => [
    pgCore
      .unique("sps_h_page_url_language_unique")
      .on(table.url, table.language),
  ],
);
