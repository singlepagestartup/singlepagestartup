import * as pgCore from "drizzle-orm/pg-core";

export const fields = {
  id: pgCore.uuid("id").primaryKey().defaultRandom(),
  createdAt: pgCore.timestamp("created_at").notNull().defaultNow(),
  updatedAt: pgCore.timestamp("updated_at").notNull().defaultNow(),
  variant: pgCore.text("variant").notNull().default("default"),
  string: pgCore.text("string"),
  number: pgCore.numeric("number"),
  boolean: pgCore.boolean("boolean"),
  date: pgCore.timestamp("date"),
  datetime: pgCore.timestamp("datetime"),
};
