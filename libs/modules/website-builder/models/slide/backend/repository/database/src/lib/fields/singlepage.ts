import * as pgCore from "drizzle-orm/pg-core";

export const fields = {
  id: pgCore.uuid("id").primaryKey().defaultRandom(),
  createdAt: pgCore.timestamp("created_at").notNull().defaultNow(),
  updatedAt: pgCore.timestamp("updated_at").notNull().defaultNow(),
  variant: pgCore.text("variant").notNull().default("default"),
  title: pgCore.text("title"),
  adminTitle: pgCore
    .text("admin_title")
    .notNull()
    .$defaultFn(() => "title"),
  subtitle: pgCore.text("subtitle"),
  description: pgCore.text("description"),
  className: pgCore.text("class_name"),
  slug: pgCore
    .text("slug")
    .notNull()
    .unique()
    .$defaultFn(
      () =>
        "lower(regexp_replace(trim(both ' ' from title),'[^a-zA-Z0-9]+','-','g'))",
    ),
};
