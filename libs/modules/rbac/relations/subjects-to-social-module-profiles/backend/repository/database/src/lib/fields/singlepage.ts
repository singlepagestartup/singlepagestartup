import { Table as Subject } from "@sps/rbac/models/subject/backend/repository/database";
import { Table as SocialModuleProfile } from "@sps/social/models/profile/backend/repository/database";
import * as pgCore from "drizzle-orm/pg-core";

export const fields = {
  id: pgCore.uuid("id").primaryKey().defaultRandom(),
  createdAt: pgCore.timestamp("created_at").notNull().defaultNow(),
  updatedAt: pgCore.timestamp("updated_at").notNull().defaultNow(),
  variant: pgCore.text("variant").notNull().default("default"),
  orderIndex: pgCore.integer("order_index").notNull().default(0),
  className: pgCore.text("class_name"),
  subjectId: pgCore
    .uuid("st_id")
    .notNull()
    .references(() => Subject.id, { onDelete: "cascade" }),
  socialModuleProfileId: pgCore
    .uuid("sl_me_pe_id")
    .notNull()
    .references(() => SocialModuleProfile.id, { onDelete: "cascade" }),
};
