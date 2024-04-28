import { serial, timestamp, pgTable, text } from "drizzle-orm/pg-core";

export const schema = pgTable("pages", {
  id: serial("id").primaryKey(),
  title: text("title").default("Page"),
  description: text("description").default("Description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
