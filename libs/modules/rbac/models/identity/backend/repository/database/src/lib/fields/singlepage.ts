import * as pgCore from "drizzle-orm/pg-core";

export const fields = {
  password: pgCore.text("password"),
  salt: pgCore.text("salt"),
  account: pgCore.text("account"),
  email: pgCore.text("email"),
  provider: pgCore.text("provider").notNull().default("email"),
  id: pgCore.uuid("id").primaryKey().defaultRandom(),
  createdAt: pgCore.timestamp("created_at").notNull().defaultNow(),
  updatedAt: pgCore.timestamp("updated_at").notNull().defaultNow(),
  variant: pgCore.text("variant").notNull().default("default"),
};
