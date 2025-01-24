import * as pgCore from "drizzle-orm/pg-core";

export const fields = {
  title: pgCore.text("title").notNull(),
  adminTitle: pgCore.text("admin_title").notNull(),
  id: pgCore.uuid("id").primaryKey().defaultRandom(),
  createdAt: pgCore.timestamp("created_at").notNull().defaultNow(),
  updatedAt: pgCore.timestamp("updated_at").notNull().defaultNow(),
  variant: pgCore.text("variant").notNull().default("default"),
  slug: pgCore.text("slug").notNull().unique(),
  interval: pgCore.text("interval"),
};
