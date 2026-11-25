import * as pgCore from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { fields } from "./fields";

export const moduleName = "sps_cm";
export const table = "funnel";
const pgTable = pgCore.pgTableCreator((name) => `${moduleName}_${name}`);

export const Table = pgTable(table, fields, (t) => [
  pgCore
    .index("cm_funnel_store_updated")
    .on(t.storeId, t.updatedAt.desc(), t.id.desc()),
  pgCore.index("cm_funnel_store_kind").on(t.storeId, t.kind),
  pgCore.uniqueIndex("cm_funnel_store_slug").on(t.storeId, t.slug),
  pgCore.check(
    "cm_funnel_slug_format",
    sql`length(${t.slug}) <= 200 AND ${t.slug} ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND ${t.slug} <> 'new'`,
  ),
]);
