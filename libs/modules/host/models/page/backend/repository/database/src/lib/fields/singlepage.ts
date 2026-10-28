import * as pgCore from "drizzle-orm/pg-core";
import { randomWordsGenerator } from "@sps/shared-utils";

export const fields = {
  id: pgCore.uuid("id").primaryKey().defaultRandom(),
  title: pgCore.text("title").notNull().default("Page"),
  url: pgCore.text("url").notNull().default("/"),
  description: pgCore.text("description").default("Description"),
  createdAt: pgCore.timestamp("created_at").notNull().defaultNow(),
  updatedAt: pgCore.timestamp("updated_at").notNull().defaultNow(),
  variant: pgCore.text("variant").notNull().default("default"),
  className: pgCore.text("class_name"),
  indexing: pgCore
    .text("indexing", { enum: ["auto", "noindex"] })
    .notNull()
    .default("auto"),
  language: pgCore.text("language").notNull().default("en"),
  adminTitle: pgCore
    .text("admin_title")
    .notNull()
    .$defaultFn(() => randomWordsGenerator({ type: "title" })),
};
