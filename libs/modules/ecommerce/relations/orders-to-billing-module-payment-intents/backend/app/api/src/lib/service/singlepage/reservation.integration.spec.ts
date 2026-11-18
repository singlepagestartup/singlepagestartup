/**
 * Given two independent payment attempts for the last available offer unit,
 * only one can hold it. Payment, expiry and retries preserve stock and holds.
 */
import { randomUUID } from "node:crypto";
import { eq, getTableName } from "drizzle-orm";
import { db } from "@sps/providers-db";
import { getPostgresClient } from "@sps/shared-backend-database-config";
import { Table as Product } from "@sps/ecommerce/models/product/backend/repository/database";
import { Table as Store } from "@sps/ecommerce/models/store/backend/repository/database";
import { Table as Offer } from "@sps/ecommerce/relations/stores-to-products/backend/repository/database";
import { Table as Order } from "@sps/ecommerce/models/order/backend/repository/database";
import { Table as Line } from "@sps/ecommerce/relations/orders-to-products/backend/repository/database";
import { Table as Attribute } from "@sps/ecommerce/models/attribute/backend/repository/database";
import { Table as AttributeKey } from "@sps/ecommerce/models/attribute-key/backend/repository/database";
import { Table as KeyAttribute } from "@sps/ecommerce/relations/attribute-keys-to-attributes/backend/repository/database";
import { Table as OfferAttribute } from "@sps/ecommerce/relations/stores-to-products-to-attributes/backend/repository/database";
import { Table as Intent } from "@sps/billing/models/payment-intent/backend/repository/database";
import { Table as Invoice } from "@sps/billing/models/invoice/backend/repository/database";
import { Table as IntentInvoice } from "@sps/billing/relations/payment-intents-to-invoices/backend/repository/database";
import {
  Table as PaymentRelation,
  type IPurchaseSnapshot,
} from "@sps/ecommerce/relations/orders-to-billing-module-payment-intents/backend/repository/database";
import { Configuration } from "../../configuration";
import { Repository } from "../../repository";
import { bootstrap } from "../../bootstrap";
import type { IReservationLine } from "./reservation";
import { bootstrap as bootstrapPaymentIntent } from "@sps/billing/models/payment-intent/backend/app/api/src/lib/bootstrap";

const cleanups: (() => Promise<unknown>)[] = [];
afterEach(async () => {
  jest.restoreAllMocks();
  for (const cleanup of cleanups.splice(0).reverse()) {
    await cleanup();
  }
});
afterAll(async () => {
  await getPostgresClient().end();
});

async function fixture(stock = 1) {
  const productId = randomUUID();
  const storeId = randomUUID();
  const offerId = randomUUID();
  const attributeId = randomUUID();
  await db.insert(Product).values({ id: productId });
  cleanups.push(() => db.delete(Product).where(eq(Product.id, productId)));
  await db.insert(Store).values({ id: storeId });
  cleanups.push(() => db.delete(Store).where(eq(Store.id, storeId)));
  await db
    .insert(Offer)
    .values({ id: offerId, productId, storeId, sku: `reservation-${offerId}` });
  cleanups.push(() => db.delete(Offer).where(eq(Offer.id, offerId)));
  await db.insert(Attribute).values({ id: attributeId, number: String(stock) });
  cleanups.push(() =>
    db.delete(Attribute).where(eq(Attribute.id, attributeId)),
  );
  await db
    .insert(AttributeKey)
    .values({ slug: "stock_quantity", field: "number" })
    .onConflictDoNothing();
  const [key] = await db
    .select()
    .from(AttributeKey)
    .where(eq(AttributeKey.slug, "stock_quantity"));
  await db.insert(KeyAttribute).values({ attributeId, attributeKeyId: key.id });
  cleanups.push(() =>
    db.delete(KeyAttribute).where(eq(KeyAttribute.attributeId, attributeId)),
  );
  await db
    .insert(OfferAttribute)
    .values({ storesToProductsId: offerId, attributeId });
  cleanups.push(() =>
    db
      .delete(OfferAttribute)
      .where(eq(OfferAttribute.attributeId, attributeId)),
  );
  const { service: relation } = await bootstrap();
  const { service: second } = await bootstrap();
  const { service: intents } = await bootstrapPaymentIntent(
    relation.paymentLifecycle,
  );
  const invoices = intents.billingModule.invoice;
  const attempts: {
    intentId: string;
    invoiceId: string;
    line: IReservationLine;
  }[] = [];
  for (let index = 0; index < 2; index++) {
    const orderId = randomUUID();
    const lineId = randomUUID();
    const intentId = randomUUID();
    const invoiceId = randomUUID();
    await db.insert(Order).values({ id: orderId });
    cleanups.push(() => db.delete(Order).where(eq(Order.id, orderId)));
    await db
      .insert(Line)
      .values({ id: lineId, orderId, productId, offerId, quantity: 1 });
    cleanups.push(() => db.delete(Line).where(eq(Line.id, lineId)));
    await db.insert(Intent).values({ id: intentId, amount: 12.34 });
    cleanups.push(() => db.delete(Intent).where(eq(Intent.id, intentId)));
    await db.insert(Invoice).values({
      id: invoiceId,
      amount: 12.34,
      status: "open",
      provider: "dummy",
    });
    cleanups.push(() => db.delete(Invoice).where(eq(Invoice.id, invoiceId)));
    await db
      .insert(IntentInvoice)
      .values({ invoiceId, paymentIntentId: intentId });
    cleanups.push(() =>
      db.delete(IntentInvoice).where(eq(IntentInvoice.invoiceId, invoiceId)),
    );
    cleanups.push(() =>
      db
        .delete(PaymentRelation)
        .where(eq(PaymentRelation.billingModulePaymentIntentId, intentId)),
    );
    const snapshot: IPurchaseSnapshot = {
      version: 1,
      currencyId: randomUUID(),
      amount: "12.34",
      orderAmount: "12.34",
      purchaseType: "one_off",
      parentLineId: null,
      quoteVersion: "fixture-v1",
      quoteExpiresAt: new Date(Date.now() + 60_000).toISOString(),
      destination: {},
      charge: {
        offerId,
        productId,
        storeId,
        providerStoreId: storeId,
        role: "product",
        recurrence: "each",
        quantity: 1,
        stockQuantity: stock,
        amount: "12.34",
        formula: "unit_price * quantity",
        formulaVersion: "v1",
        inputs: { unit_price: "12.34", quantity: "1" },
      },
    };
    attempts.push({
      intentId,
      invoiceId,
      line: { orderId, orderLineId: lineId, offerId, quantity: 1, snapshot },
    });
  }
  return {
    offerId,
    attributeId,
    relation,
    second,
    intents,
    invoices,
    attempts,
  };
}

it("allows only one independent attempt to reserve the last unit and consumes it once on duplicate fractional payments", async () => {
  const f = await fixture();
  const outcomes = await Promise.allSettled(
    f.attempts.map((attempt, index) => {
      const service = index === 0 ? f.relation : f.second;
      return service.withOfferLocks({ offerIds: [f.offerId] }, () =>
        service.reserveCharges({
          paymentIntentId: attempt.intentId,
          lines: [attempt.line],
        }),
      );
    }),
  );
  expect(
    outcomes.filter((outcome) => outcome.status === "fulfilled"),
  ).toHaveLength(1);
  expect(
    await f.relation.reservedQuantities({ offerIds: [f.offerId] }),
  ).toEqual({ [f.offerId]: 1 });
  const winner =
    f.attempts[outcomes.findIndex((outcome) => outcome.status === "fulfilled")];
  await f.relation.withOfferLocks({ offerIds: [f.offerId] }, () =>
    f.relation.reserveCharges({
      paymentIntentId: winner.intentId,
      lines: [winner.line],
    }),
  );
  await Promise.all(
    [1, 2, 3].map(() =>
      f.intents.settlePayment({
        invoiceId: winner.invoiceId,
        provider: "dummy",
        amount: 12.34,
      }),
    ),
  );
  const [stock] = await db
    .select()
    .from(Attribute)
    .where(eq(Attribute.id, f.attributeId));
  expect(Number(stock.number)).toBe(0);
  expect(
    await f.relation.reservedQuantities({ offerIds: [f.offerId] }),
  ).toEqual({ [f.offerId]: 0 });
  const rows = await db
    .select()
    .from(PaymentRelation)
    .where(eq(PaymentRelation.billingModulePaymentIntentId, winner.intentId));
  expect(rows).toHaveLength(1);
  expect(rows[0].reservationStatus).toBe("consumed");
  expect((await f.invoices.findById({ id: winner.invoiceId }))?.amount).toBe(
    12.34,
  );
});

it("reads finite stock through the key junction and keeps unlimited attempts visible as outstanding holds", async () => {
  const f = await fixture();
  const repository = new Repository(new Configuration());
  const generated = repository
    .stockQuery([f.offerId], "stock_quantity")
    .toSQL();
  expect(generated.sql).toContain(
    `"${getTableName(KeyAttribute)}"."${KeyAttribute.attributeKeyId.name}" = "${getTableName(AttributeKey)}"."id"`,
  );
  expect(
    (await f.relation.stockForOffers([f.offerId])).get(f.offerId)?.quantity,
  ).toBe(1);
  await db
    .delete(OfferAttribute)
    .where(eq(OfferAttribute.attributeId, f.attributeId));
  expect((await f.relation.stockForOffers([f.offerId])).has(f.offerId)).toBe(
    false,
  );
  for (const attempt of f.attempts) {
    await f.relation.withOfferLocks({ offerIds: [f.offerId] }, () =>
      f.relation.reserveCharges({
        paymentIntentId: attempt.intentId,
        lines: [attempt.line],
      }),
    );
  }
  expect(
    await f.relation.reservedQuantities({ offerIds: [f.offerId] }),
  ).toEqual({ [f.offerId]: 2 });
});

it("rolls stock and reservations back with a failed settlement write, then retries", async () => {
  const f = await fixture();
  const attempt = f.attempts[0];
  await f.relation.withOfferLocks({ offerIds: [f.offerId] }, () =>
    f.relation.reserveCharges({
      paymentIntentId: attempt.intentId,
      lines: [attempt.line],
    }),
  );
  const fail = jest
    .spyOn(f.intents, "update")
    .mockRejectedValueOnce(new Error("payment write failure"));
  await expect(
    f.intents.settlePayment({
      invoiceId: attempt.invoiceId,
      provider: "dummy",
      amount: 12.34,
    }),
  ).rejects.toThrow("payment write failure");
  expect(
    await f.relation.reservedQuantities({ offerIds: [f.offerId] }),
  ).toEqual({ [f.offerId]: 1 });
  const [stock] = await db
    .select()
    .from(Attribute)
    .where(eq(Attribute.id, f.attributeId));
  expect(Number(stock.number)).toBe(1);
  expect((await f.invoices.findById({ id: attempt.invoiceId }))?.status).toBe(
    "open",
  );
  fail.mockRestore();
  await f.intents.settlePayment({
    invoiceId: attempt.invoiceId,
    provider: "dummy",
    amount: 12.34,
  });
});

it("releases expiry once and records a late paid attempt for reconciliation when another buyer used the stock", async () => {
  const f = await fixture();
  const [first, second] = f.attempts;
  await f.relation.withOfferLocks({ offerIds: [f.offerId] }, () =>
    f.relation.reserveCharges({
      paymentIntentId: first.intentId,
      lines: [first.line],
    }),
  );
  await f.intents.expireInvoice({
    invoiceId: first.invoiceId,
    provider: "dummy",
    expiresBefore: new Date(Date.now() + 1_000),
  });
  await f.intents.expireInvoice({
    invoiceId: first.invoiceId,
    provider: "dummy",
    expiresBefore: new Date(Date.now() + 1_000),
  });
  expect(
    await f.relation.reservedQuantities({ offerIds: [f.offerId] }),
  ).toEqual({ [f.offerId]: 0 });
  await f.second.withOfferLocks({ offerIds: [f.offerId] }, () =>
    f.second.reserveCharges({
      paymentIntentId: second.intentId,
      lines: [second.line],
    }),
  );
  await f.intents.settlePayment({
    invoiceId: second.invoiceId,
    provider: "dummy",
    amount: 12.34,
  });
  await f.intents.settlePayment({
    invoiceId: first.invoiceId,
    provider: "dummy",
    amount: 12.34,
  });
  expect((await f.invoices.findById({ id: first.invoiceId }))?.status).toBe(
    "paid",
  );
  expect((await f.intents.findById({ id: first.intentId }))?.status).toBe(
    "requires_reconciliation",
  );
  const [stock] = await db
    .select()
    .from(Attribute)
    .where(eq(Attribute.id, f.attributeId));
  expect(Number(stock.number)).toBe(0);
});

it("records a late canceled purchase for review and never resumes it on repeated callbacks", async () => {
  const f = await fixture();
  const attempt = f.attempts[0];
  await f.relation.withOfferLocks({ offerIds: [f.offerId] }, () =>
    f.relation.reserveCharges({
      paymentIntentId: attempt.intentId,
      lines: [attempt.line],
    }),
  );
  await f.intents.repository.withPaymentIntentLock(
    attempt.intentId,
    async () => {
      const invoice = await f.invoices.findById({ id: attempt.invoiceId });
      const intent = await f.intents.findById({ id: attempt.intentId });
      await f.invoices.update({
        id: attempt.invoiceId,
        data: { ...invoice!, status: "canceled" },
      });
      await f.intents.update({
        id: attempt.intentId,
        data: { ...intent!, status: "canceled" },
      });
      await f.relation.releaseReservations({
        paymentIntentIds: [attempt.intentId],
      });
    },
  );
  await f.intents.settlePayment({
    invoiceId: attempt.invoiceId,
    provider: "dummy",
    amount: 12.34,
  });
  await f.intents.settlePayment({
    invoiceId: attempt.invoiceId,
    provider: "dummy",
    amount: 12.34,
  });
  expect((await f.invoices.findById({ id: attempt.invoiceId }))?.status).toBe(
    "paid",
  );
  expect((await f.intents.findById({ id: attempt.intentId }))?.status).toBe(
    "requires_reconciliation",
  );
  const [stock] = await db
    .select()
    .from(Attribute)
    .where(eq(Attribute.id, f.attributeId));
  expect(Number(stock.number)).toBe(1);
});
