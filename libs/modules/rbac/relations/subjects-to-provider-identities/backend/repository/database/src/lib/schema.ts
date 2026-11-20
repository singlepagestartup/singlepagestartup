import * as pg from "drizzle-orm/pg-core";
import { Table as Subject } from "@sps/rbac/models/subject/backend/repository/database";
import { Table as Identity } from "@sps/rbac/models/identity/backend/repository/database";
import { Table as Store } from "@sps/ecommerce/models/store/backend/repository/database";

export const moduleName = "sps_rc";
export const table = "subject_provider_identity";

export const Table = pg.pgTable(
  "sps_rc_subject_provider_identity",
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
    subjectId: pg
      .uuid("subject_id")
      .notNull()
      .references(() => Subject.id),
    identityId: pg
      .uuid("identity_id")
      .notNull()
      .references(() => Identity.id),
    ownerId: pg
      .uuid("owner_id")
      .notNull()
      .references(() => Subject.id),
    storeId: pg
      .uuid("store_id")
      .notNull()
      .references(() => Store.id),
    label: pg.text("label").notNull(),
    externalAccount: pg.text("external_account").notNull(),
    version: pg.uuid("version").notNull(),
    active: pg.boolean("active").default(true).notNull(),
  },
  (t) => [
    pg.uniqueIndex("sps_rc_outbound_identity_owner").on(t.identityId),
    pg.index("sps_rc_provider_store").on(t.storeId, t.subjectId),
  ],
);
