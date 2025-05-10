import { randomWordsGenerator } from "@sps/shared-utils";
import * as pgCore from "drizzle-orm/pg-core";

export const fields = {
  id: pgCore.uuid("id").primaryKey().defaultRandom().notNull(),
  createdAt: pgCore.timestamp("created_at").notNull().defaultNow(),
  updatedAt: pgCore.timestamp("updated_at").notNull().defaultNow(),
  variant: pgCore.text("variant").notNull().default("default"),
  slug: pgCore
    .text("slug")
    .notNull()
    .unique()
    .$defaultFn(() => randomWordsGenerator({ type: "slug" })),
};
