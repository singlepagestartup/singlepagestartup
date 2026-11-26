import * as pgCore from "drizzle-orm/pg-core";
import { Table as Funnel } from "@sps/crm/models/funnel/backend/repository/database/src/lib/schema";
import { Table as Stage } from "@sps/crm/models/stage/backend/repository/database/src/lib/schema";

export const moduleName = "sps_cm";
export const table = "funnels_to_stages";
const pgTable = pgCore.pgTableCreator((name) => `${moduleName}_${name}`);

export const Table = pgTable(
  table,
  {
    id: pgCore.uuid("id").primaryKey().defaultRandom(),
    createdAt: pgCore
      .timestamp("created_at", { precision: 3 })
      .notNull()
      .defaultNow(),
    funnelId: pgCore
      .uuid("funnel_id")
      .notNull()
      .references(() => Funnel.id, { onDelete: "restrict" }),
    stageId: pgCore
      .uuid("stage_id")
      .notNull()
      .references(() => Stage.id, { onDelete: "restrict" }),
    position: pgCore.integer("position").notNull(),
  },
  (t) => [
    pgCore.uniqueIndex("cm_funnels_to_stages_pair").on(t.funnelId, t.stageId),
    pgCore.index("cm_funnels_to_stages_order").on(t.funnelId, t.position),
  ],
);
