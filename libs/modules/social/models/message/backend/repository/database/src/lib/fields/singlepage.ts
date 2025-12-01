import * as pgCore from "drizzle-orm/pg-core";

export const fields = {
  id: pgCore.uuid("id").primaryKey().defaultRandom(),
  createdAt: pgCore.timestamp("created_at").notNull().defaultNow(),
  updatedAt: pgCore.timestamp("updated_at").notNull().defaultNow(),
  className: pgCore.text("class_name"),
  variant: pgCore.text("variant").notNull().default("default"),
  title: pgCore.text("title"),
  subtitle: pgCore.text("subtitle"),
  description: pgCore.text("description"),
  sourceSystemId: pgCore.text("source_system_id"),
  interaction: pgCore
    .jsonb("interaction")
    .$type<{ [key: string]: any }>()
    .default({}),
};
