import * as pgCore from "drizzle-orm/pg-core";

export const fields = {
  id: pgCore.uuid("id").primaryKey().defaultRandom(),
  createdAt: pgCore.timestamp("created_at").notNull().defaultNow(),
  updatedAt: pgCore.timestamp("updated_at").notNull().defaultNow(),
  variant: pgCore.text("variant").notNull().default("default"),
  title: pgCore.text("title"),
  slug: pgCore.text("slug").notNull().unique(),
  adminTitle: pgCore.text("admin_title").notNull(),
  orderIndex: pgCore.integer("order_index"),
  className: pgCore.text("class_name"),
};
