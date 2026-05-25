import { randomWordsGenerator } from "@sps/shared-utils";
import { sql } from "drizzle-orm";
import * as pgCore from "drizzle-orm/pg-core";

export const fields = {
  id: pgCore.uuid("id").primaryKey().defaultRandom(),
  createdAt: pgCore.timestamp("created_at").notNull().defaultNow(),
  updatedAt: pgCore.timestamp("updated_at").notNull().defaultNow(),
  className: pgCore.text("class_name"),
  variant: pgCore.text("variant").notNull().default("default"),
  adminTitle: pgCore
    .text("admin_title")
    .notNull()
    .$defaultFn(() => randomWordsGenerator({ type: "title" })),
  slug: pgCore
    .text("slug")
    .notNull()
    .unique()
    .$defaultFn(() => randomWordsGenerator({ type: "slug" })),
  title: pgCore.text("title").notNull(),
  description: pgCore.text("description").notNull().default(""),
  status: pgCore.text("status").notNull().default("draft"),
  summary: pgCore.text("summary"),
  tags: pgCore
    .jsonb("tags")
    .$type<string[]>()
    .notNull()
    .default(sql`'[]'::jsonb`),
  metadata: pgCore
    .jsonb("metadata")
    .$type<Record<string, unknown>>()
    .notNull()
    .default(sql`'{}'::jsonb`),
  contentHash: pgCore.text("content_hash").notNull().default(""),
  lastIndexedAt: pgCore.timestamp("last_indexed_at", { mode: "date" }),
};
