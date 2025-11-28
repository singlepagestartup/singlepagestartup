import * as pgCore from "drizzle-orm/pg-core";
import { randomWordsGenerator } from "@sps/shared-utils";

export const fields = {
  id: pgCore.uuid("id").primaryKey().defaultRandom(),
  createdAt: pgCore.timestamp("created_at").notNull().defaultNow(),
  updatedAt: pgCore.timestamp("updated_at").notNull().defaultNow(),
  variant: pgCore.text("variant").notNull().default("default"),
  type: pgCore.text("type").notNull().default("feature"),
  field: pgCore.text("field").notNull().default("string"),
  adminTitle: pgCore
    .text("admin_title")
    .notNull()
    .$defaultFn(() => randomWordsGenerator({ type: "title" })),
  slug: pgCore
    .text("slug")
    .notNull()
    .unique()
    .$defaultFn(() => randomWordsGenerator({ type: "slug" })),
  title: pgCore
    .jsonb("title")
    .$type<{ [key: string]: string | undefined }>()
    .default({}),
  prefix: pgCore
    .jsonb("prefix")
    .$type<{ [key: string]: string | undefined }>()
    .default({}),
  suffix: pgCore
    .jsonb("suffix")
    .$type<{ [key: string]: string | undefined }>()
    .default({}),
};
