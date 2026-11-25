import * as pgCore from "drizzle-orm/pg-core";
import { Table as Funnel } from "@sps/crm/models/funnel/backend/repository/database/src/lib/schema";
import { Table as Offer } from "@sps/ecommerce/relations/stores-to-products/backend/repository/database/src/lib/schema";

export const moduleName = "sps_cm";
export const table = "funnels_to_offers";
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
    offerId: pgCore
      .uuid("offer_id")
      .notNull()
      .references(() => Offer.id, { onDelete: "cascade" }),
  },
  (t) => [
    pgCore.uniqueIndex("cm_funnels_to_offers_pair").on(t.funnelId, t.offerId),
    pgCore.index("cm_funnels_to_offers_offer").on(t.offerId),
  ],
);
