import * as pgCore from "drizzle-orm/pg-core";
import { fields } from "./fields";

export const moduleName = "sps_cm";
export const table = "funnel_publication";
const pgTable = pgCore.pgTableCreator((name) => `${moduleName}_${name}`);

export const Table = pgTable(table, fields, (t) => [
  pgCore.uniqueIndex("cm_funnel_publication_version").on(t.funnelId, t.version),
  pgCore
    .uniqueIndex("cm_funnel_publication_draft")
    .on(t.funnelId, t.draftRevision),
  pgCore
    .uniqueIndex("cm_funnel_publication_operation")
    .on(t.funnelId, t.operationKey),
]);
