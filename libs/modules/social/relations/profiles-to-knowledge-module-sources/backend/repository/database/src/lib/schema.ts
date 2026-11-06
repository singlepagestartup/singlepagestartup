import * as pgCore from "drizzle-orm/pg-core";
import { Table as Profile } from "@sps/social/models/profile/backend/repository/database";
import { Table as Source } from "@sps/knowledge/models/source/backend/repository/database";

export const moduleName = "sl";
export const table = "ps_to_ke_me_ss_gch";

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
    profileId: pgCore
      .uuid("pe_id")
      .notNull()
      .references(() => Profile.id, { onDelete: "cascade" }),
    knowledgeModuleSourceId: pgCore
      .uuid("ke_me_se_id")
      .notNull()
      .references(() => Source.id, { onDelete: "cascade" }),
  },
  (table) => ({
    pairUnique: pgCore
      .unique("sl_profile_source_unique")
      .on(table.profileId, table.knowledgeModuleSourceId),
  }),
);
