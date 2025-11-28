import { randomWordsGenerator } from "@sps/shared-utils";
import * as pgCore from "drizzle-orm/pg-core";

export const fields = {
  id: pgCore.uuid("id").primaryKey().defaultRandom(),
  createdAt: pgCore.timestamp("created_at").notNull().defaultNow(),
  updatedAt: pgCore.timestamp("updated_at").notNull().defaultNow(),
  variant: pgCore.text("variant").notNull().default("default"),
  type: pgCore.text("type").notNull().default("one_off"),
  slug: pgCore
    .text("slug")
    .notNull()
    .unique()
    .$defaultFn(() => randomWordsGenerator({ type: "slug" })),
  title: pgCore
    .jsonb("title")
    .$type<{ [key: string]: string | undefined }>()
    .default({}),
  shortDescription: pgCore
    .jsonb("short_description")
    .$type<{ [key: string]: string | undefined }>()
    .default({}),
  description: pgCore
    .jsonb("description")
    .$type<{ [key: string]: string | undefined }>()
    .default({}),
  adminTitle: pgCore
    .text("admin_title")
    .notNull()
    .$defaultFn(() => randomWordsGenerator({ type: "title" })),
};
