import { sql } from "drizzle-orm";
import {
  pgSchema,
  text,
  jsonb,
  timestamp,
  bigint,
  index,
  boolean,
} from "drizzle-orm/pg-core";

export const consistency = pgSchema("sps_consistency");

export const consistencyState = consistency.table("state", {
  id: text("id").primaryKey(),
  value: text("value").notNull(),
});

export const consistencyGenerations = consistency.table("generation", {
  key: text("key").primaryKey(),
  version: bigint("version", { mode: "bigint" })
    .notNull()
    .default(sql`0`),
});

export const consistencyOutbox = consistency.table(
  "outbox",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()::text`),
    operationId: text("operation_id").notNull(),
    keys: jsonb("keys").$type<string[]>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    processed: boolean("processed").notNull().default(false),
  },
  (t) => [index("consistency_outbox_pending").on(t.processed, t.createdAt)],
);

export const consistencyDelivery = consistency.table(
  "delivery",
  {
    sequence: bigint("sequence", { mode: "bigint" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    eventId: text("event_id").notNull().unique(),
    keys: jsonb("keys").$type<string[]>().notNull(),
    versions: jsonb("versions").$type<Record<string, string>>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("consistency_delivery_created").on(t.createdAt)],
);

export const consistencyQueries = consistency.table(
  "query",
  {
    ref: text("ref").primaryKey(),
    fingerprint: text("fingerprint").unique(),
    identity: text("identity").notNull(),
    auth: text("auth").notNull(),
    dependencies: jsonb("dependencies")
      .$type<Record<string, string>>()
      .notNull(),
    collections: jsonb("collections")
      .$type<Record<string, string>>()
      .notNull()
      .default({}),
    tags: jsonb("tags").$type<string[]>().notNull().default([]),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    retainUntil: timestamp("retain_until", { withTimezone: true })
      .notNull()
      .default(sql`now() + interval '12 hours 7 minutes'`),
  },
  (t) => [
    index("consistency_query_expiry").on(t.expiresAt),
    index("consistency_query_retention").on(t.retainUntil),
    index("consistency_query_dependencies").using("gin", t.dependencies),
  ],
);

export const consistencyResources = consistency.table("resource", {
  resource: text("resource").primaryKey(),
  topic: text("topic").notNull(),
  columns: jsonb("columns").$type<Record<string, string>>().notNull(),
});
