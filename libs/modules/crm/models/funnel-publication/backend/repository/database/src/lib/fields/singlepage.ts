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
  funnelId: pgCore.uuid("funnel_id").notNull(),
  version: pgCore.integer("version").notNull(),
  draftRevision: pgCore.integer("draft_revision").notNull(),
  name: pgCore.text("name").notNull(),
  kind: pgCore.text("kind").$type<TFunnelKind>().notNull(),
  definition: pgCore.jsonb("definition").$type<IFunnelDefinition>().notNull(),
  bindings: pgCore.jsonb("bindings").$type<IFunnelBindings>().notNull(),
  actorId: pgCore.uuid("actor_id").notNull(),
  operationKey: pgCore.text("operation_key").notNull(),
};
