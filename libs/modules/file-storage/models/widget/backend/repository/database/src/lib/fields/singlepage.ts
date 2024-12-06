import * as pgCore from "drizzle-orm/pg-core";

export const fields = {
  variant: pgCore.text("variant").default("default"),
  id: pgCore.uuid("id").primaryKey().defaultRandom(),
  createdAt: pgCore.timestamp("created_at").notNull().defaultNow(),
  updatedAt: pgCore.timestamp("updated_at").notNull().defaultNow(),
  title: pgCore.text("title"),
  slug: pgCore.text("slug").unique(),
};
