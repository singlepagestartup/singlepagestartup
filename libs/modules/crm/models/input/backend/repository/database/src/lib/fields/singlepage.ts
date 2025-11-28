import * as pgCore from "drizzle-orm/pg-core";
import { randomWordsGenerator } from "@sps/shared-utils";

export const fields = {
  id: pgCore.uuid("id").primaryKey().defaultRandom(),
  createdAt: pgCore.timestamp("created_at").notNull().defaultNow(),
  updatedAt: pgCore.timestamp("updated_at").notNull().defaultNow(),
  variant: pgCore.text("variant").notNull().default("default"),
  type: pgCore.text("type").notNull().default("default"),
  isRequired: pgCore.boolean("is_required").notNull().default(false),
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
  className: pgCore.text("class_name"),
  adminTitle: pgCore
    .text("admin_title")
    .notNull()
    .$defaultFn(() => randomWordsGenerator({ type: "title" })),
  slug: pgCore
    .text("slug")
    .notNull()
    .unique()
    .$defaultFn(() => randomWordsGenerator({ type: "slug" })),
  placeholder: pgCore
    .jsonb("placeholder")
    .$type<{ [key: string]: string | undefined }>()
    .default({}),
  label: pgCore
    .jsonb("label")
    .$type<{ [key: string]: string | undefined }>()
    .default({}),
};
