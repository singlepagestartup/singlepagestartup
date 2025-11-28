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
};
