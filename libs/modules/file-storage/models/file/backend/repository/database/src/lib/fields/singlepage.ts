import * as pgCore from "drizzle-orm/pg-core";
import { randomWordsGenerator } from "@sps/shared-utils";

export const fields = {
  id: pgCore.uuid("id").primaryKey().defaultRandom(),
  file: pgCore.text("file").notNull().unique(),
  containerClassName: pgCore.text("container_class_name"),
  className: pgCore.text("class_name"),
  createdAt: pgCore.timestamp("created_at").notNull().defaultNow(),
  updatedAt: pgCore.timestamp("updated_at").notNull().defaultNow(),
  variant: pgCore.text("variant").notNull().default("default"),
  adminTitle: pgCore
    .text("admin_title")
    .notNull()
    .$defaultFn(() => randomWordsGenerator({ type: "title" })),
  width: pgCore.integer("width"),
  height: pgCore.integer("height"),
  alt: pgCore.text("alt"),
  size: pgCore.integer("size"),
  extension: pgCore.text("extension"),
  mimeType: pgCore.text("mime_type"),
  slug: pgCore
    .text("slug")
    .notNull()
    .unique()
    .$defaultFn(() => randomWordsGenerator({ type: "slug" })),
};
