import * as pgCore from "drizzle-orm/pg-core";

export const fields = {
  id: pgCore.uuid("id").primaryKey().defaultRandom(),
  createdAt: pgCore.timestamp("created_at").notNull().defaultNow(),
  updatedAt: pgCore.timestamp("updated_at").notNull().defaultNow(),
  variant: pgCore.text("variant").notNull().default("default"),
  title: pgCore.text("title").notNull(),
  description: pgCore.text("description"),
  shortDescription: pgCore.text("short_description").default(""),
  slug: pgCore.text("slug").notNull().unique(),
};
