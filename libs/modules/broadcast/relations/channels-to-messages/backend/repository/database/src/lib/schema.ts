import { sql } from "drizzle-orm";
import * as pgCore from "drizzle-orm/pg-core";
import { Table as Channel } from "@sps/broadcast/models/channel/backend/repository/database";
import { Table as Message } from "@sps/broadcast/models/message/backend/repository/database";

export const moduleName = "sps_bt";
export const table = "cs_to_ms_34z";

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
    feedVisible: pgCore.boolean("feed_visible").notNull().default(true),
    deliveryKey: pgCore.text("delivery_key"),
    receipt: pgCore.text("receipt"),
    claimedAt: pgCore.timestamp("claimed_at", { withTimezone: true }),
    startedAt: pgCore.timestamp("started_at", { withTimezone: true }),
    leaseUntil: pgCore.timestamp("lease_until", { withTimezone: true }),
    finishedAt: pgCore.timestamp("finished_at", { withTimezone: true }),
    channelId: pgCore
      .uuid("cl_id")
      .notNull()
      .references(() => Channel.id, { onDelete: "cascade" }),
    messageId: pgCore
      .uuid("me_id")
      .notNull()
      .references(() => Message.id, { onDelete: "cascade" }),
  },
  (link) => [
    pgCore
      .index("bt_channel_message_lookup")
      .on(link.channelId, link.messageId),
    pgCore.index("bt_message_channel_cleanup").on(link.messageId),
    pgCore
      .uniqueIndex("bt_delivery_channel_key")
      .on(link.channelId, link.deliveryKey)
      .where(sql`${link.deliveryKey} is not null`),
    pgCore
      .uniqueIndex("bt_delivery_owner")
      .on(link.messageId)
      .where(sql`${link.deliveryKey} is not null`),
    pgCore
      .index("bt_delivery_pending")
      .on(link.channelId, link.createdAt, link.messageId)
      .where(
        sql`${link.deliveryKey} is not null and ${link.finishedAt} is null`,
      ),
    pgCore
      .index("bt_delivery_leases")
      .on(link.channelId, link.leaseUntil)
      .where(
        sql`${link.deliveryKey} is not null and ${link.finishedAt} is null and ${link.leaseUntil} is not null`,
      ),
    pgCore
      .index("bt_delivery_completed")
      .on(link.channelId, link.finishedAt, link.messageId)
      .where(
        sql`${link.deliveryKey} is not null and ${link.finishedAt} is not null`,
      ),
  ],
);
