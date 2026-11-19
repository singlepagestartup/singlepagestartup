import { sql } from "drizzle-orm";
import * as pg from "drizzle-orm/pg-core";
import { Table as Subject } from "@sps/rbac/models/subject/backend/repository/database";
import { Table as Identity } from "@sps/rbac/models/identity/backend/repository/database";
import { Table as Store } from "@sps/ecommerce/models/store/backend/repository/database";

export const moduleName = "sps_rc";
export const table = "subject_provider_agent";

export const Table = pg.pgTable(
  "sps_rc_subject_provider_agent",
  {
    id: pg.uuid("id").primaryKey().defaultRandom(),
    createdAt: pg
      .timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: pg
      .timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    subjectId: pg.uuid("subject_id").references(() => Subject.id),
    executorId: pg
      .uuid("executor_id")
      .notNull()
      .references(() => Subject.id),
    identityId: pg
      .uuid("identity_id")
      .notNull()
      .references(() => Identity.id),
    storeId: pg
      .uuid("store_id")
      .notNull()
      .references(() => Store.id),
    capability: pg.text("capability").notNull(),
    model: pg.text("model").notNull(),
    terms: pg.jsonb("terms").notNull(),
  },
  (t) => [
    pg
      .uniqueIndex("sps_rc_agent_provider_capability")
      .on(t.storeId, t.subjectId, t.capability),
    pg
      .uniqueIndex("sps_rc_store_default_provider_capability")
      .on(t.storeId, t.capability)
      .where(sql`${t.subjectId} IS NULL`),
  ],
);
