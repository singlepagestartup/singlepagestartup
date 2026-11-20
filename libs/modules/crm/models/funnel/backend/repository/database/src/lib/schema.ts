import * as pgCore from "drizzle-orm/pg-core";
import { fields } from "./fields";

export const moduleName = "sps_cm";
export const table = "funnel";
const pgTable = pgCore.pgTableCreator((name) => `${moduleName}_${name}`);

export const Table = pgTable(table, fields, (t) => [
  pgCore
    .index("cm_funnel_store_updated")
    .on(t.storeId, t.updatedAt.desc(), t.id.desc()),
  pgCore.index("cm_funnel_store_kind").on(t.storeId, t.kind),
]);
