import * as pgCore from "drizzle-orm/pg-core";

export const fields = {
  id: pgCore.uuid("id").primaryKey().defaultRandom(),
  createdAt: pgCore.timestamp("created_at").notNull().defaultNow(),
  updatedAt: pgCore.timestamp("updated_at").notNull().defaultNow(),
  variant: pgCore.text("variant").notNull().default("default"),
  status: pgCore.text("status").notNull().default("new"),
  method: pgCore.text("method").notNull().default("email"),
  title: pgCore.text("title"),
  data: pgCore.text("data"),
  reciever: pgCore.text("reciever").notNull(),
  attachments: pgCore.text("attachments"),
  sendAfter: pgCore.timestamp("send_after").notNull().defaultNow(),
  sourceSystemId: pgCore.text("source_system_id"),
};
