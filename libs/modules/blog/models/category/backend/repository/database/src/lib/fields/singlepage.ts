import * as pgCore from "drizzle-orm/pg-core";

export const fields = {
  id: pgCore.uuid("id").primaryKey().defaultRandom(),
  className: pgCore.text("class_name"),
  adminTitle: pgCore.text("admin_title").notNull(),
  createdAt: pgCore.timestamp("created_at").notNull().defaultNow(),
  updatedAt: pgCore.timestamp("updated_at").notNull().defaultNow(),
  variant: pgCore.text("variant").notNull().default("default"),
  title: pgCore
    .jsonb("title")
    .$type<{ [key: string]: string | undefined }>()
    .default({}),
  subtitle: pgCore
    .jsonb("subtitle")
    .$type<{ [key: string]: string | undefined }>()
    .default({}),
  description: pgCore
    .jsonb("description")
    .$type<{ [key: string]: string | undefined }>()
    .default({}),
};
