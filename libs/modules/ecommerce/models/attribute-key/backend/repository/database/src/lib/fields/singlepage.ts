import * as pgCore from "drizzle-orm/pg-core";

export const fields = {
  id: pgCore.uuid("id").primaryKey().defaultRandom(),
  createdAt: pgCore.timestamp("created_at").notNull().defaultNow(),
  updatedAt: pgCore.timestamp("updated_at").notNull().defaultNow(),
  variant: pgCore.text("variant").notNull().default("default"),
  type: pgCore.text("type").notNull().default("feature"),
  title: pgCore.text("title").notNull(),
  slug: pgCore.text("slug").notNull(),
  prefix: pgCore.text("prefix"),
  suffix: pgCore.text("suffix"),
};
