import * as pgCore from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { Table as Offer } from "@sps/ecommerce/relations/stores-to-products/backend/repository/database";

export const moduleName = "sps_ee";
export const table = "offers_to_offers";
const pgTable = pgCore.pgTableCreator((name) => `${moduleName}_${name}`);

export const Table = pgTable(
  table,
  {
    id: pgCore.uuid("id").primaryKey().defaultRandom(),
    createdAt: pgCore.timestamp("created_at").notNull().defaultNow(),
    updatedAt: pgCore.timestamp("updated_at").notNull().defaultNow(),
    variant: pgCore.text("variant").notNull().default("delivery"),
    orderIndex: pgCore.integer("order_index").notNull().default(0),
    className: pgCore.text("class_name"),
    sourceOfferId: pgCore
      .uuid("source_offer_id")
      .notNull()
      .references(() => Offer.id, { onDelete: "cascade" }),
    targetOfferId: pgCore
      .uuid("target_offer_id")
      .notNull()
      .references(() => Offer.id, { onDelete: "cascade" }),
    recurrence: pgCore
      .text("recurrence")
      .$type<"first" | "each">()
      .notNull()
      .default("first"),
  },
  (t) => [
    pgCore.check(
      "different_offers",
      sql`${t.sourceOfferId} <> ${t.targetOfferId}`,
    ),
    pgCore.check(
      "offer_link_variant",
      sql`${t.variant} in ('delivery', 'add-on', 'fulfilled-by')`,
    ),
    pgCore.check(
      "offer_link_recurrence",
      sql`${t.recurrence} in ('first', 'each')`,
    ),
    pgCore
      .uniqueIndex("ee_offer_link_target")
      .on(t.sourceOfferId, t.variant, t.targetOfferId),
    pgCore
      .uniqueIndex("ee_offer_fulfiller")
      .on(t.sourceOfferId)
      .where(sql`${t.variant} = 'fulfilled-by'`),
  ],
);
