import * as pgCore from "drizzle-orm/pg-core";
import type {
  IFunnelBindings,
  IFunnelDefinition,
  TFunnelKind,
} from "@sps/crm/models/funnel/sdk/model/src/lib/workflow";

export const fields = {
  id: pgCore.uuid("id").primaryKey().defaultRandom(),
  createdAt: pgCore
    .timestamp("created_at", { precision: 3 })
    .notNull()
    .defaultNow(),
  updatedAt: pgCore
    .timestamp("updated_at", { precision: 3 })
    .notNull()
    .defaultNow(),
  storeId: pgCore.uuid("store_id").notNull(),
  name: pgCore.text("name").notNull(),
  kind: pgCore.text("kind").$type<TFunnelKind>().notNull(),
  definition: pgCore.jsonb("definition").$type<IFunnelDefinition>().notNull(),
  bindings: pgCore.jsonb("bindings").$type<IFunnelBindings>().notNull(),
  revision: pgCore.integer("revision").notNull().default(1),
  publishedVersion: pgCore.integer("published_version"),
};
