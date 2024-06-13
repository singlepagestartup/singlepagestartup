import * as pgCore from "drizzle-orm/pg-core";

export const fields = {
  id: pgCore.uuid("id").primaryKey().defaultRandom(),
  createdAt: pgCore.timestamp("created_at").notNull().defaultNow(),
  updatedAt: pgCore.timestamp("updated_at").notNull().defaultNow(),
  variant: pgCore.text("variant").notNull().default("default"),
  title: pgCore.text("title").notNull(),
  username: pgCore.text("username").notNull().unique(),
  token: pgCore.text("token").notNull().unique(),
  password: pgCore.text("password").notNull(),
  status: pgCore.text("status").notNull().default("active"),
};
