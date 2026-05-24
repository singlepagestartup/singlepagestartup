import { randomWordsGenerator } from "@sps/shared-utils";
import { sql } from "drizzle-orm";
import * as pgCore from "drizzle-orm/pg-core";
import { vector } from "drizzle-orm/pg-core/columns/vector_extension/vector";

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
  text: pgCore.text("text").notNull(),
  embedding: vector("embedding", { dimensions: 768 }).notNull(),
  chunkIndex: pgCore.integer("chunk_index").notNull(),
  tokenEstimate: pgCore.integer("token_estimate").notNull().default(0),
  contentHash: pgCore.text("content_hash").notNull(),
  metadata: pgCore
    .jsonb("metadata")
    .$type<Record<string, unknown>>()
    .notNull()
    .default(sql`'{}'::jsonb`),
};
