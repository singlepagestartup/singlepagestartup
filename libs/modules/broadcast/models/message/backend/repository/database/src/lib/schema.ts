import * as pgCore from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { fields } from "./fields";

export const moduleName = "sps_bt";
export const table = "message";

const pgTable = pgCore.pgTableCreator((name) => `${moduleName}_${name}`);

export const Table = pgTable(table, { ...fields }, (message) => [
  pgCore
    .index("bt_durable_message_cleanup")
    .on(message.id)
    .where(sql`${message.expiresAt} is null`),
  pgCore
    .index("bt_message_expiry")
    .on(message.expiresAt)
    .where(sql`${message.expiresAt} is not null`),
]);
