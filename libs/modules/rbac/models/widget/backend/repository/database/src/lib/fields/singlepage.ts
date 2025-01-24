import * as pgCore from "drizzle-orm/pg-core";

export const fields = {
  className: pgCore.text("class_name"),
  title: pgCore.text("title"),
  adminTitle: pgCore.text("admin_title").notNull(),
  subtitle: pgCore.text("subtitle"),
  description: pgCore.text("description"),
  id: pgCore.uuid("id").primaryKey().defaultRandom(),
  createdAt: pgCore.timestamp("created_at").notNull().defaultNow(),
  updatedAt: pgCore.timestamp("updated_at").notNull().defaultNow(),
  variant: pgCore.text("variant").notNull().default("default"),
  slug: pgCore.text("slug").notNull().unique(),
};
