import * as pgCore from "drizzle-orm/pg-core";

export const fields = {
  title: pgCore.text("title"),
  subTitle: pgCore.text("subtitle"),
  description: pgCore.text("description"),
  anchor: pgCore.text("anchor"),
  className: pgCore.text("class_name"),
  id: pgCore.uuid("id").primaryKey().defaultRandom(),
  createdAt: pgCore.timestamp("created_at").notNull().defaultNow(),
  updatedAt: pgCore.timestamp("updated_at").notNull().defaultNow(),
};
