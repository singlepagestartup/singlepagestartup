import * as pgCore from "drizzle-orm/pg-core";
import { randomWordsGenerator } from "@sps/shared-utils";

export const fields = {
  title: pgCore.text("title"),
  subtitle: pgCore.text("subtitle"),
  description: pgCore.text("description"),
  anchor: pgCore.text("anchor"),
  className: pgCore.text("class_name"),
  id: pgCore.uuid("id").primaryKey().defaultRandom(),
  createdAt: pgCore.timestamp("created_at").notNull().defaultNow(),
  updatedAt: pgCore.timestamp("updated_at").notNull().defaultNow(),
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
};
