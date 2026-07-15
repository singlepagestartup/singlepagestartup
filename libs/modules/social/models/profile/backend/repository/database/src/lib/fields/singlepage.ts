import { randomWordsGenerator } from "@sps/shared-utils";
import { sql } from "drizzle-orm";
import * as pgCore from "drizzle-orm/pg-core";

export const supportedMcpServerIdentifiers = ["singlepagestartup"] as const;

export type TSupportedMcpServerIdentifier =
  (typeof supportedMcpServerIdentifiers)[number];

export const fields = {
  id: pgCore.uuid("id").primaryKey().defaultRandom(),
  createdAt: pgCore.timestamp("created_at").notNull().defaultNow(),
  updatedAt: pgCore.timestamp("updated_at").notNull().defaultNow(),
  className: pgCore.text("class_name"),
  variant: pgCore.text("variant").notNull().default("default"),
  title: pgCore
    .jsonb("title")
    .$type<{ [key: string]: string | undefined }>()
    .default({}),
  subtitle: pgCore
    .jsonb("subtitle")
    .$type<{ [key: string]: string | undefined }>()
    .default({}),
  description: pgCore
    .jsonb("description")
    .$type<{ [key: string]: string | undefined }>()
    .default({}),
  allowedMcpServerIds: pgCore
    .jsonb("allowed_mcp_server_ids")
    .$type<TSupportedMcpServerIdentifier[]>()
    .notNull()
    .default(sql`'[]'::jsonb`),
  adminTitle: pgCore
    .text("admin_title")
    .notNull()
    .$defaultFn(() => randomWordsGenerator({ type: "title" })),
  slug: pgCore
    .text("slug")
    .notNull()
    .unique()
    .$defaultFn(() => randomWordsGenerator({ type: "slug" })),
};
