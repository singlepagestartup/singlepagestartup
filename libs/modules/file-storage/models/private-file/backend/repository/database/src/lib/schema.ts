import * as pgCore from "drizzle-orm/pg-core";

export const moduleName = "sps_fs";
export const table = "private_file";
const pgTable = pgCore.pgTableCreator((name) => `${moduleName}_${name}`);

const binary = pgCore.customType<{ data: Buffer; driverData: Buffer }>({
  dataType: () => "bytea",
});

export const Table = pgTable(table, {
  id: pgCore.uuid("id").primaryKey().defaultRandom(),
  createdAt: pgCore.timestamp("created_at").notNull().defaultNow(),
  name: pgCore.text("name").notNull(),
  mimeType: pgCore.text("mime_type").notNull(),
  size: pgCore.integer("size").notNull(),
  digest: pgCore.text("digest").notNull(),
  bytes: binary("bytes").notNull(),
});
