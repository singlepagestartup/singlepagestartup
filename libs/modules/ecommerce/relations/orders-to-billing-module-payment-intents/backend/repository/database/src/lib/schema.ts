import * as pgCore from "drizzle-orm/pg-core";
import { Table as Order } from "@sps/ecommerce/models/order/backend/repository/database";
import { Table as BillingModulePaymentIntent } from "@sps/billing/models/payment-intent/backend/repository/database";
import { Table as OrderLine } from "@sps/ecommerce/relations/orders-to-products/backend/repository/database";
import { Table as Offer } from "@sps/ecommerce/relations/stores-to-products/backend/repository/database";

export interface IPurchaseSnapshot {
  version: 1;
  currencyId: string;
  amount: string;
  orderAmount: string;
  purchaseType: "one_off" | "subscription";
  interval?: string;
  parentLineId: string | null;
  quoteVersion: string;
  quoteExpiresAt: string;
  charge: {
    offerId: string;
    productId: string;
    storeId: string;
    providerStoreId: string;
    role: "product" | "delivery" | "add-on";
    recurrence: "first" | "each";
    quantity: number;
    stockQuantity: number | null;
    amount: string;
    formula: string;
    formulaVersion: string;
    inputs: Record<string, string>;
    title?: string;
    storeTitle?: string;
    providerStoreTitle?: string;
  };
  destination: {
    address?: string;
    region?: string;
    pickupPointId?: string;
    coordinates?: { latitude: number; longitude: number };
  };
}

export const moduleName = "sps_ee";
export const table = "os_to_bg_me_pt_is_cvb";

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
    orderId: pgCore
      .uuid("or_id")
      .notNull()
      .references(() => Order.id, { onDelete: "cascade" }),
    billingModulePaymentIntentId: pgCore
      .uuid("bg_me_pt_it_id")
      .notNull()
      .references(() => BillingModulePaymentIntent.id, { onDelete: "cascade" }),
    orderLineId: pgCore
      .uuid("order_line_id")
      .references(() => OrderLine.id, { onDelete: "restrict" }),
    offerId: pgCore
      .uuid("offer_id")
      .references(() => Offer.id, { onDelete: "restrict" }),
    reservationQuantity: pgCore
      .integer("reservation_quantity")
      .notNull()
      .default(0),
    reservationStatus: pgCore
      .text("reservation_status")
      .notNull()
      .default("none"),
    purchaseSnapshot: pgCore
      .jsonb("purchase_snapshot")
      .$type<IPurchaseSnapshot>(),
  },
  (table) => [
    pgCore
      .uniqueIndex("sps_ee_payment_attempt_order_line_unique")
      .on(table.billingModulePaymentIntentId, table.orderLineId),
    pgCore
      .index("sps_ee_offer_reservation_status")
      .on(table.offerId, table.reservationStatus),
  ],
);
