import * as pgCore from "drizzle-orm/pg-core";
import { type IEntityMetadata, randomWordsGenerator } from "@sps/shared-utils";

export const fields = {
  metadata: pgCore
    .jsonb("metadata")
    .$type<IEntityMetadata>()
    .notNull()
    .default({}),
  id: pgCore.uuid("id").primaryKey().defaultRandom(),
  title: pgCore.text("title").notNull().default("Page"),
  url: pgCore.text("url").notNull().default("/").unique(),
  description: pgCore.text("description").default("Description"),
  createdAt: pgCore.timestamp("created_at").notNull().defaultNow(),
  updatedAt: pgCore.timestamp("updated_at").notNull().defaultNow(),
  variant: pgCore.text("variant").notNull().default("default"),
  className: pgCore.text("class_name"),
  indexing: pgCore
    .text("indexing", { enum: ["auto", "noindex"] })
    .notNull()
    .default("auto"),
  // Legacy storage only; URL lookup and presentation locale do not use this field.
  language: pgCore.text("language").notNull().default("en"),
  adminTitle: pgCore
    .text("admin_title")
    .notNull()
    .$defaultFn(() => randomWordsGenerator({ type: "title" })),
};
