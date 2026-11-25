import { sql } from "drizzle-orm";
import * as pgCore from "drizzle-orm/pg-core";
import { Table as Subject } from "@sps/rbac/models/subject/backend/repository/database";
import { Table as SocialModuleChat } from "@sps/social/models/chat/backend/repository/database";

export const moduleName = "rc";
export const table = "subject_to_social_chat";
const pgTable = pgCore.pgTableCreator((name) => `${moduleName}_${name}`);

export const Table = pgTable(
  table,
  {
    id: pgCore.uuid("id").primaryKey().defaultRandom(),
    createdAt: pgCore.timestamp("created_at").notNull().defaultNow(),
    updatedAt: pgCore.timestamp("updated_at").notNull().defaultNow(),
    variant: pgCore.text("variant").notNull().default("default"),
    orderIndex: pgCore.integer("order_index").notNull().default(0),
    className: pgCore.text("class_name"),
    subjectId: pgCore
      .uuid("subject_id")
      .notNull()
      .references(() => Subject.id, { onDelete: "cascade" }),
    socialModuleChatId: pgCore
      .uuid("social_chat_id")
      .notNull()
      .references(() => SocialModuleChat.id, { onDelete: "cascade" }),
  },
  (row) => [
    pgCore
      .uniqueIndex("rc_social_chat_owner")
      .on(row.socialModuleChatId)
      .where(sql`${row.variant} = 'owner'`),
    pgCore
      .uniqueIndex("rc_subject_social_chat_role")
      .on(row.subjectId, row.socialModuleChatId, row.variant),
  ],
);
