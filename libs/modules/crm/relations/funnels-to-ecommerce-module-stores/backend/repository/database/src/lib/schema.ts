import * as pgCore from "drizzle-orm/pg-core";
import { Table as Funnel } from "@sps/crm/models/funnel/backend/repository/database/src/lib/schema";
import { Table as Store } from "@sps/ecommerce/models/store/backend/repository/database/src/lib/schema";

export const moduleName = "sps_cm";
export const table = "funnels_to_stores";
const pgTable = pgCore.pgTableCreator((name) => `${moduleName}_${name}`);

export const Table = pgTable(
  table,
  {
    id: pgCore.uuid("id").primaryKey().defaultRandom(),
    createdAt: pgCore
      .timestamp("created_at", { precision: 3 })
      .notNull()
      .defaultNow(),
    funnelId: pgCore
      .uuid("funnel_id")
      .notNull()
      .references(() => Funnel.id, { onDelete: "restrict" }),
    storeId: pgCore
      .uuid("store_id")
      .notNull()
      .references(() => Store.id, { onDelete: "restrict" }),
  },
  (t) => [
    pgCore.uniqueIndex("cm_funnels_to_stores_owner").on(t.funnelId),
    pgCore.index("cm_funnels_to_stores_target").on(t.storeId),
  ],
);
