import { randomWordsGenerator } from "@sps/shared-utils";
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
  content: pgCore.text("content").notNull().default(""),
  description: pgCore.text("description"),
  contentHash: pgCore.text("content_hash").notNull().default(""),
  indexedContentHash: pgCore.text("indexed_content_hash"),
  lastIndexedAt: pgCore.timestamp("last_indexed_at", { mode: "date" }),
};
