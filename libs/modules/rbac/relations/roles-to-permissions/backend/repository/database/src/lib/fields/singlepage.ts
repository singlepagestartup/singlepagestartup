import { Table as Permission } from "@sps/rbac/models/permission/backend/repository/database";
import { Table as Role } from "@sps/rbac/models/role/backend/repository/database";
import * as pgCore from "drizzle-orm/pg-core";

export const fields = {
  id: pgCore.uuid("id").primaryKey().defaultRandom(),
  createdAt: pgCore.timestamp("created_at").notNull().defaultNow(),
  updatedAt: pgCore.timestamp("updated_at").notNull().defaultNow(),
  variant: pgCore.text("variant").notNull().default("default"),
  orderIndex: pgCore.integer("order_index").notNull().default(0),
  className: pgCore.text("class_name"),
  roleId: pgCore
    .uuid("re_id")
    .notNull()
    .references(() => Role.id, { onDelete: "cascade" }),
  permissionId: pgCore
    .uuid("pn_id")
    .notNull()
    .references(() => Permission.id, { onDelete: "cascade" }),
  condition: pgCore.text("condition"),
};
