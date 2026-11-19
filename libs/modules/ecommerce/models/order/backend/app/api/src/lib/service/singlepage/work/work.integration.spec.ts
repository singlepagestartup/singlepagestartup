import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { createAppAssembly } from "@sps/shared-backend-api";
import {
  getDrizzle,
  getPostgresClient,
  resetPostgresClient,
} from "@sps/shared-backend-database-config";
import { createService as createOrder } from "@sps/ecommerce/models/order/backend/app/api/src/lib/bootstrap";
import { Table as OrderWork } from "@sps/ecommerce/models/order-work/backend/repository/database";
import { Table as OrderWorkLink } from "@sps/ecommerce/relations/orders-to-order-works/backend/repository/database";
import { Table as OrderPaymentLink } from "@sps/ecommerce/relations/orders-to-billing-module-payment-intents/backend/repository/database";
import { Table as Order } from "@sps/ecommerce/models/order/backend/repository/database";
import { Table as Currency } from "@sps/billing/models/currency/backend/repository/database";
import { Table as Invoice } from "@sps/billing/models/invoice/backend/repository/database";
import { Table as PaymentIntent } from "@sps/billing/models/payment-intent/backend/repository/database";
import { Table as InvoiceLink } from "@sps/billing/relations/payment-intents-to-invoices/backend/repository/database";
import { Table as PrivateFile } from "@sps/file-storage/models/private-file/backend/repository/database";

const cleanup: (() => Promise<unknown>)[] = [];

afterEach(async () => {
  for (const remove of cleanup.splice(0).reverse()) {
    await remove();
  }
});
afterAll(async () => {
  await getPostgresClient().end();
  resetPostgresClient();
});

it("freezes the checkout version, confirms the order atomically, and delivers the frozen file once after a retry", async () => {
  const order = createOrder(createAppAssembly());
  const db = getDrizzle({});
  const entity = await order.create({ data: {} });
  cleanup.push(() => db.delete(Order).where(eq(Order.id, entity.id)));
  cleanup.push(() =>
    db.delete(OrderWork).where(eq(OrderWork.orderId, entity.id)),
  );
  cleanup.push(() =>
    db.delete(OrderWorkLink).where(eq(OrderWorkLink.orderId, entity.id)),
  );

  const [currency] = await db
    .insert(Currency)
    .values({
      slug: `order-work-${randomUUID()}`,
      symbol: "$",
      title: "Fixture currency",
    })
    .returning();
  cleanup.push(() => db.delete(Currency).where(eq(Currency.id, currency.id)));
  const scope = {
    orderId: entity.id,
    taskId: randomUUID(),
    storeId: randomUUID(),
    customerId: randomUUID(),
  };
  await order.work.register({ ...scope, kind: "individual-service" });
  const checkout = {
    orderId: entity.id,
    customerId: scope.customerId,
    lines: [],
  };
  await expect(order.work.acceptedCheckout(checkout)).rejects.toThrow(
    "Accept a result",
  );
  const createResult = async (number: number) => {
    const result = await order.work.publishResult({
      ...scope,
      actorId: scope.customerId,
      operationKey: randomUUID(),
      currencyId: currency.id,
      price: number === 1 ? "25.00" : "31.27",
      original: {
        name: `cover-${number}.png`,
        mimeType: "image/png",
        bytes: Buffer.from(`original ${number}`),
      },
      preview: {
        name: `cover-preview-${number}.png`,
        mimeType: "image/png",
        bytes: Buffer.from(`preview ${number}`),
      },
    });
    for (const fileId of [result.originalFileId, result.previewFileId]) {
      cleanup.push(() =>
        db.delete(PrivateFile).where(eq(PrivateFile.id, fileId)),
      );
    }
    return result;
  };
  const first = await createResult(1);
  const second = await createResult(2);
  await order.work.accept({
    ...scope,
    resultVersionId: first.id,
    operationKey: randomUUID(),
  });
  const selected = (await order.work.acceptedCheckout(checkout))?.checkout;
  expect(selected).toMatchObject({
    resultVersionId: first.id,
    price: "25.00000000",
  });
  expect((await order.work.resultPriceForOrder(entity.id))?.price).toBe(
    "25.00000000",
  );

  const [intent] = await db
    .insert(PaymentIntent)
    .values({
      amount: 24,
      status: "succeeded",
      checkoutCurrencyId: currency.id,
      checkoutMetadata: {
        ecommerceModule: { orders: [{ id: entity.id, orderWork: selected }] },
      },
    })
    .returning();
  cleanup.push(() =>
    db.delete(PaymentIntent).where(eq(PaymentIntent.id, intent.id)),
  );
  const [invoice] = await db
    .insert(Invoice)
    .values({ amount: 24, status: "paid", provider: "dummy" })
    .returning();
  cleanup.push(() => db.delete(Invoice).where(eq(Invoice.id, invoice.id)));
  await db
    .insert(InvoiceLink)
    .values({ paymentIntentId: intent.id, invoiceId: invoice.id });
  cleanup.push(() =>
    db.delete(InvoiceLink).where(eq(InvoiceLink.paymentIntentId, intent.id)),
  );
  await db
    .insert(OrderPaymentLink)
    .values({ orderId: entity.id, billingModulePaymentIntentId: intent.id });
  cleanup.push(() =>
    db.delete(OrderPaymentLink).where(eq(OrderPaymentLink.orderId, entity.id)),
  );

  const paying = await order.update({
    id: entity.id,
    data: { status: "paying", type: "history" },
  });
  await order.work.accept({
    ...scope,
    resultVersionId: second.id,
    operationKey: randomUUID(),
  });
  const finalize = {
    id: entity.id,
    expectedStatus: "paying",
    expectedUpdatedAt: paying!.updatedAt,
    onPaymentSucceeded: async () => {},
  };
  await expect(order.completePaymentStatus(finalize)).rejects.toThrow(
    "does not match an authorized order attempt",
  );
  await db
    .update(PaymentIntent)
    .set({ amount: 25 })
    .where(eq(PaymentIntent.id, intent.id));
  await db
    .update(Invoice)
    .set({ amount: 25 })
    .where(eq(Invoice.id, invoice.id));
  const confirmations = await Promise.all([
    order.completePaymentStatus(finalize),
    order.completePaymentStatus(finalize),
  ]);
  expect(confirmations.filter(Boolean)).toHaveLength(1);
  const paid = await order.work.findByOrder(entity.id);
  expect(paid?.paid).toMatchObject({
    resultVersionId: first.id,
    invoiceId: invoice.id,
    paymentIntentId: intent.id,
    customerId: scope.customerId,
  });
  expect(paid?.acceptedVersionId).toBe(second.id);
  expect((await order.work.resultPriceForOrder(entity.id))?.price).toBe(
    "25.00000000",
  );

  const eventId = paid!.paid!.id;
  const saved = { orderId: entity.id, eventId };
  const receipt = async () => ({
    name: "receipt.pdf",
    mimeType: "application/pdf",
    bytes: Buffer.from("%PDF-1.4\npaid receipt"),
  });
  await expect(
    order.work.deliver(
      saved,
      async () => {
        throw new Error("fixture grant failure");
      },
      receipt,
    ),
  ).rejects.toThrow("fixture grant failure");
  expect((await order.work.findByOrder(entity.id))?.deliveredAt).toBeNull();

  const grant = jest.fn(async () => {});
  const delivered = await order.work.deliver(saved, grant, receipt);
  cleanup.push(() =>
    db.delete(PrivateFile).where(eq(PrivateFile.id, delivered.receiptFileId!)),
  );
  await order.work.deliver(saved, grant, receipt);
  expect(grant).toHaveBeenCalledTimes(1);
  expect(grant).toHaveBeenCalledWith(
    expect.objectContaining({ resultVersionId: first.id }),
    [delivered.receiptFileId, first.originalFileId],
  );
  expect(delivered.resultFileId).toBe(first.originalFileId);
  const file = await order.modules.fileStorage.privateFile.findById({
    id: delivered.resultFileId!,
  });
  expect(file?.bytes.toString()).toBe("original 1");
});
