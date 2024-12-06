import * as pgCore from "drizzle-orm/pg-core";

export const fields = {
  className: pgCore.text("class_name"),
  description: pgCore.text("description"),
  subtitle: pgCore.text("subtitle"),
  title: pgCore.text("title"),
  id: pgCore.uuid("id").primaryKey().defaultRandom(),
  createdAt: pgCore.timestamp("created_at").notNull().defaultNow(),
  updatedAt: pgCore.timestamp("updated_at").notNull().defaultNow(),
  variant: pgCore.text("variant").notNull().default("default"),
  slug: pgCore.text("slug").unique(),
};
