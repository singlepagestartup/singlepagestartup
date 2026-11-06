import * as pgCore from "drizzle-orm/pg-core";
import { fields } from "./fields";

export const moduleName = "sps_ke";
export const table = "source";

const pgTable = pgCore.pgTableCreator((name) => `${moduleName}_${name}`);

export const Table = pgTable(
  table,
  {
    ...fields,
  },
  (table) => {
    return {
      contentHashIdx: pgCore
        .index("sps_ke_source_content_hash_idx")
        .on(table.contentHash),
    };
  },
);
