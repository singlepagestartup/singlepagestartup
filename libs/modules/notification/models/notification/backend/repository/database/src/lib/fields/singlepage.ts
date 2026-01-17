import * as pgCore from "drizzle-orm/pg-core";

export const fields = {
  id: pgCore.uuid("id").primaryKey().defaultRandom(),
  createdAt: pgCore.timestamp("created_at").notNull().defaultNow(),
  updatedAt: pgCore.timestamp("updated_at").notNull().defaultNow(),
  variant: pgCore.text("variant").notNull().default("default"),
  status: pgCore.text("status").notNull().default("new"),
  title: pgCore.text("title"),
  data: pgCore.jsonb("data").$type<{ [key: string]: any }>().default({}),
  reciever: pgCore.text("reciever").notNull(),
  attachments: pgCore
    .jsonb("attachments")
    .$type<
      {
        url: string;
        type: string;
      }[]
    >()
    .default([]),
  sendAfter: pgCore.timestamp("send_after").notNull().defaultNow(),
  sourceSystemId: pgCore.text("source_system_id"),
};
