import * as pg from "drizzle-orm/pg-core";

export const moduleName = "sps_bg";
export const table = "wallet";

export const Table = pg.pgTable("sps_bg_wallet", {
  id: pg.uuid("id").primaryKey().defaultRandom(),
  createdAt: pg.timestamp("created_at").defaultNow().notNull(),
  updatedAt: pg.timestamp("updated_at").defaultNow().notNull(),
  variant: pg.text("variant").default("default").notNull(),
});
