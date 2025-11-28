import { sql } from "drizzle-orm";
import * as pgCore from "drizzle-orm/pg-core";

export const fields = {
  id: pgCore.uuid("id").primaryKey().defaultRandom(),
  createdAt: pgCore.timestamp("created_at").notNull().defaultNow(),
  updatedAt: pgCore.timestamp("updated_at").notNull().defaultNow(),
  variant: pgCore.text("variant").notNull().default("default"),
  expiresAt: pgCore
    .timestamp("expires_at", { mode: "date" })
    .notNull()
    .default(sql`NOW() + INTERVAL '1 monyh'`),
  payload: pgCore.jsonb("payload").$type<{ [key: string]: any }>().default({}),
};
