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
  type: pgCore.text("type").notNull().default("document"),
  content: pgCore.text("content").notNull().default(""),
  description: pgCore.text("description"),
  originalPath: pgCore.text("original_path").notNull().unique(),
  contentHash: pgCore.text("content_hash").notNull(),
  status: pgCore.text("status").notNull().default("pending"),
  lastIndexedAt: pgCore.timestamp("last_indexed_at", { mode: "date" }),
  metadata: pgCore
    .jsonb("metadata")
    .$type<Record<string, unknown>>()
    .notNull()
    .default(sql`'{}'::jsonb`),
};
