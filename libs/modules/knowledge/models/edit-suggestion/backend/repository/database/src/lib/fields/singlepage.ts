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
  targetDocumentId: pgCore.uuid("target_document_id"),
  operation: pgCore.text("operation").notNull().default("update"),
  status: pgCore.text("status").notNull().default("pending"),
  proposedDescription: pgCore
    .text("proposed_description")
    .notNull()
    .default(""),
  rationale: pgCore.text("rationale").notNull().default(""),
  metadata: pgCore
    .jsonb("metadata")
    .$type<Record<string, unknown>>()
    .notNull()
    .default(sql`'{}'::jsonb`),
};
