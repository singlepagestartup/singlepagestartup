import * as pgCore from "drizzle-orm/pg-core";
import type { IFunnelStage } from "@sps/crm/models/stage/sdk/model/src/lib/workflow";

export const fields = {
  id: pgCore.uuid("id").primaryKey().defaultRandom(),
  createdAt: pgCore
    .timestamp("created_at", { precision: 3 })
    .notNull()
    .defaultNow(),
  key: pgCore.text("key").notNull(),
  name: pgCore.text("name").notNull(),
  configuration: pgCore
    .jsonb("configuration")
    .$type<Omit<IFunnelStage, "id" | "name">>()
    .notNull(),
};
