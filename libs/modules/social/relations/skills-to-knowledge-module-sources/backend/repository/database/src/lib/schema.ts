import * as pgCore from "drizzle-orm/pg-core";
import { Table as Skill } from "@sps/social/models/skill/backend/repository/database";
import { Table as Source } from "@sps/knowledge/models/source/backend/repository/database";

export const moduleName = "sl";
export const table = "ss_to_ke_me_sources";

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
    skillId: pgCore
      .uuid("skill_id")
      .notNull()
      .references(() => Skill.id, { onDelete: "cascade" }),
    knowledgeModuleSourceId: pgCore
      .uuid("ke_me_se_id")
      .notNull()
      .references(() => Source.id, { onDelete: "cascade" }),
  },
  (table) => ({
    pairUnique: pgCore
      .unique("sl_skill_source_unique")
      .on(table.skillId, table.knowledgeModuleSourceId),
  }),
);
