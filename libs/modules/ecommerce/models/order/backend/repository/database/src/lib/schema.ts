import * as pgCore from "drizzle-orm/pg-core";
import { fields } from "./fields";

export const moduleName = "sps_ee";
export const table = "order";

const pgTable = pgCore.pgTableCreator((name) => `${moduleName}_${name}`);

export const Table = pgTable(
  table,
  {
    ...fields,
  },
  (table) => [
    pgCore
      .uniqueIndex("sps_ee_order_subscription_next_period_unique")
      .on(table.subscriptionSourceOrderId, table.subscriptionSourceInvoiceId),
  ],
);
