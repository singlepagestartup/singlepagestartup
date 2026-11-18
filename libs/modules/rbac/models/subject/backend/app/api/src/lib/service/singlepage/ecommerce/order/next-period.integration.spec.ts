/** Separately paid periods preserve their saved service schedule and create one cart per accepted invoice. */
import { randomUUID } from "node:crypto";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@sps/providers-db";
import { getPostgresClient } from "@sps/shared-backend-database-config";
import { Table as Subject } from "@sps/rbac/models/subject/backend/repository/database";
import { Table as Owner } from "@sps/rbac/relations/subjects-to-ecommerce-module-orders/backend/repository/database";
import { Table as Product } from "@sps/ecommerce/models/product/backend/repository/database";
import { Table as Store } from "@sps/ecommerce/models/store/backend/repository/database";
import { Table as Offer } from "@sps/ecommerce/relations/stores-to-products/backend/repository/database";
import { Table as Order } from "@sps/ecommerce/models/order/backend/repository/database";
import { Table as Line } from "@sps/ecommerce/relations/orders-to-products/backend/repository/database";
import {
  Table as PaymentRelation,
  type IPurchaseSnapshot,
} from "@sps/ecommerce/relations/orders-to-billing-module-payment-intents/backend/repository/database";
import { Table as Intent } from "@sps/billing/models/payment-intent/backend/repository/database";
import { Table as Invoice } from "@sps/billing/models/invoice/backend/repository/database";
import { Table as Currency } from "@sps/billing/models/currency/backend/repository/database";
import { Table as IntentInvoice } from "@sps/billing/relations/payment-intents-to-invoices/backend/repository/database";
import { bootstrap } from "@sps/ecommerce/models/order/backend/app/api/src/lib/bootstrap";
import { bootstrap as bootstrapOwner } from "@sps/rbac/relations/subjects-to-ecommerce-module-orders/backend/app/api/src/lib/bootstrap";
import { bootstrap as bootstrapStoresToOrders } from "@sps/ecommerce/relations/stores-to-orders/backend/app/api/src/lib/bootstrap";
import { Repository } from "../../../../repository";
import { Configuration } from "../../../../configuration";
import { Service } from "./repeat";

const cleanups: (() => Promise<unknown>)[] = [];
afterEach(async () => {
  for (const cleanup of cleanups.splice(0).reverse()) {
    await cleanup();
  }
});
afterAll(async () => {
  await getPostgresClient().end();
});

async function fixture() {
  const buyerId = randomUUID();
  const storeId = randomUUID();
  const sourceId = randomUUID();
  const existingCartId = randomUUID();
  const currencyId = randomUUID();
  const intentId = randomUUID();
  const invoiceId = randomUUID();
  await db.insert(Subject).values({ id: buyerId });
  cleanups.push(() => db.delete(Subject).where(eq(Subject.id, buyerId)));
  await db.insert(Store).values({ id: storeId });
  cleanups.push(() => db.delete(Store).where(eq(Store.id, storeId)));
  await db.insert(Currency).values({
    id: currencyId,
    slug: `period-${currencyId}`,
    title: "Period fixture",
    symbol: "₽",
  });
  cleanups.push(() => db.delete(Currency).where(eq(Currency.id, currencyId)));
  await db.insert(Intent).values({
    id: intentId,
    amount: 1650,
    status: "succeeded",
    type: "one_off",
    interval: "four_weeks",
  });
  cleanups.push(() => db.delete(Intent).where(eq(Intent.id, intentId)));
  await db
    .insert(Invoice)
    .values({ id: invoiceId, amount: 1650, status: "paid", provider: "dummy" });
  cleanups.push(() => db.delete(Invoice).where(eq(Invoice.id, invoiceId)));
  await db
    .insert(IntentInvoice)
    .values({ invoiceId, paymentIntentId: intentId });
  cleanups.push(() =>
    db.delete(IntentInvoice).where(eq(IntentInvoice.invoiceId, invoiceId)),
  );
  await db.insert(Order).values([
    {
      id: sourceId,
      type: "history",
      status: "delivered",
      subscriptionPeriodInvoiceId: invoiceId,
      subscriptionPeriodStartsAt: new Date(Date.now() - 29 * 86400000),
      subscriptionPeriodEndsAt: new Date(Date.now() - 86400000),
    },
    { id: existingCartId },
  ]);
  cleanups.push(async () => {
    const next = await db
      .select({ id: Order.id })
      .from(Order)
      .where(eq(Order.subscriptionSourceOrderId, sourceId));
    await db
      .delete(Order)
      .where(
        inArray(Order.id, [
          sourceId,
          existingCartId,
          ...next.map((row) => row.id),
        ]),
      );
  });
  await db.insert(Owner).values([
    { subjectId: buyerId, ecommerceModuleOrderId: sourceId },
    { subjectId: buyerId, ecommerceModuleOrderId: existingCartId },
  ]);
  const mainLineId = randomUUID();
  const snapshots: IPurchaseSnapshot[] = [];
  for (const [index, role] of ["product", "delivery", "add-on"].entries()) {
    const productId = randomUUID();
    const offerId = randomUUID();
    const lineId = index === 0 ? mainLineId : randomUUID();
    await db.insert(Product).values({
      id: productId,
      type: index === 0 ? "subscription" : "one_off",
      kind: index === 0 ? "physical" : "service",
    });
    cleanups.push(() => db.delete(Product).where(eq(Product.id, productId)));
    await db
      .insert(Offer)
      .values({ id: offerId, storeId, productId, sku: `period-${offerId}` });
    cleanups.push(() => db.delete(Offer).where(eq(Offer.id, offerId)));
    await db.insert(Line).values({
      id: lineId,
      orderId: sourceId,
      productId,
      offerId,
      parentLineId: index === 0 ? null : mainLineId,
      quantity: 1,
      recurrence: index === 2 ? "first" : "each",
    });
    cleanups.push(async () => {
      const next = await db
        .select({ id: Order.id })
        .from(Order)
        .where(eq(Order.subscriptionSourceOrderId, sourceId));
      await db
        .delete(Line)
        .where(inArray(Line.orderId, [sourceId, ...next.map((row) => row.id)]));
    });
    const amount = ["1200", "300", "150"][index];
    const snapshot: IPurchaseSnapshot = {
      version: 1,
      currencyId,
      amount,
      orderAmount: "1650",
      purchaseType: "subscription",
      interval: "four_weeks",
      parentLineId: index === 0 ? null : mainLineId,
      quoteVersion: "paid-v1",
      quoteExpiresAt: new Date().toISOString(),
      destination: {},
      charge: {
        offerId,
        productId,
        storeId,
        providerStoreId: storeId,
        quantity: 1,
        role: role as IPurchaseSnapshot["charge"]["role"],
        recurrence: index === 2 ? "first" : "each",
        amount,
        stockQuantity: null,
        formula: "unit_price * quantity",
        formulaVersion: "v1",
        inputs: {},
      },
    };
    snapshots.push(snapshot);
    await db.insert(PaymentRelation).values({
      orderId: sourceId,
      orderLineId: lineId,
      offerId,
      billingModulePaymentIntentId: intentId,
      purchaseSnapshot: snapshot,
      reservationStatus: "consumed",
      reservationQuantity: 1,
    });
  }
  cleanups.push(() =>
    db.delete(PaymentRelation).where(eq(PaymentRelation.orderId, sourceId)),
  );
  const { app } = await bootstrap();
  const [{ app: ownerApp }, { app: storesToOrdersApp }] = await Promise.all([
    bootstrapOwner(),
    bootstrapStoresToOrders(),
  ]);
  const order = app.controller.service as any;
  const quote = jest.fn(async (input) => ({
    offerId: input.offerId,
    storeId,
    currencyId,
    amount: "1500",
    issues: [],
    version: "next-v2",
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
    charges: snapshots
      .filter((snapshot) => snapshot.charge.recurrence === "each")
      .map((snapshot) => snapshot.charge),
    destination: {},
  }));
  const service = {
    ecommerceModuleOrderAssertAccess: async ({ subjectId, orderId }) => {
      const rows = await db
        .select()
        .from(Owner)
        .where(
          and(
            eq(Owner.subjectId, subjectId),
            eq(Owner.ecommerceModuleOrderId, orderId),
          ),
        );
      if (!rows.length) {
        throw new Error("Permission error. Order is not owned");
      }
    },
    subjectsToEcommerceModuleOrders: ownerApp.controller.service,
    ecommerceModule: {
      order,
      ordersToProducts: order.ordersToProducts,
      ordersToBillingModuleCurrencies: order.ordersToBillingModuleCurrencies,
      ordersToBillingModulePaymentIntents:
        order.ordersToBillingModulePaymentIntents,
      storesToOrders: storesToOrdersApp.controller.service,
      storesToProducts: { quote },
    },
    billingModule: order.billingModule,
  };
  const operation = new Service({
    repository: new Repository(new Configuration()),
    service,
  } as any);
  return { buyerId, sourceId, existingCartId, operation, quote, order };
}

it("creates one owned next-period cart for simultaneous requests and keeps first-only services out", async () => {
  const f = await fixture();
  const props = {
    subjectId: f.buyerId,
    orderId: f.sourceId,
    mode: "next-period" as const,
  };
  const results = await Promise.all([
    f.operation.execute(props),
    f.operation.execute(props),
  ]);
  expect(results[0]).toEqual(results[1]);
  const next = await db
    .select()
    .from(Order)
    .where(eq(Order.subscriptionSourceOrderId, f.sourceId));
  expect(next).toHaveLength(1);
  expect(next[0].subscriptionSourceInterval).toBe("four_weeks");
  const lines = await db
    .select()
    .from(Line)
    .where(eq(Line.orderId, next[0].id));
  expect(lines).toHaveLength(2);
  expect(lines.every((line) => line.recurrence === "each")).toBe(true);
  expect(lines.filter((line) => line.parentLineId === null)).toHaveLength(1);
  expect(
    await db.select().from(Order).where(eq(Order.id, f.existingCartId)),
  ).toHaveLength(1);
  f.quote.mockRejectedValue(new Error("catalog changed"));
  await expect(f.operation.execute(props)).resolves.toEqual(results[0]);
  await expect(
    f.order.create({ data: { subscriptionSourceOrderId: f.sourceId } }),
  ).rejects.toThrow("server managed");
});
