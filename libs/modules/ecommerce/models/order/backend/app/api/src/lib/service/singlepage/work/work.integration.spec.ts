import { randomUUID, createHash } from "node:crypto";
import { PrivateDirectory } from "@sps/providers-file-storage";
import { eq, sql } from "drizzle-orm";
import { createAppAssembly } from "@sps/shared-backend-api";
import {
  getDrizzle,
  getPostgresClient,
  resetPostgresClient,
} from "@sps/shared-backend-database-config";
import { createService as createOrder } from "@sps/ecommerce/models/order/backend/app/api/src/lib/bootstrap";
import { Table as OrderPaymentLink } from "@sps/ecommerce/relations/orders-to-billing-module-payment-intents/backend/repository/database";
import { Table as Order } from "@sps/ecommerce/models/order/backend/repository/database";
import { Table as Currency } from "@sps/billing/models/currency/backend/repository/database";
import { Table as Invoice } from "@sps/billing/models/invoice/backend/repository/database";
import { Table as PaymentIntent } from "@sps/billing/models/payment-intent/backend/repository/database";
import { Table as InvoiceLink } from "@sps/billing/relations/payment-intents-to-invoices/backend/repository/database";

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

it("returns only fulfillment states for the requested customer's history orders", async () => {
  const order = createOrder(createAppAssembly());
  const db = getDrizzle({});
  const customerId = randomUUID();
  const create = async (owner: string, type: string) => {
    const entity = await order.create({ data: {} });
    cleanup.push(() => db.delete(Order).where(eq(Order.id, entity.id)));
    const scope = {
      orderId: entity.id,
      customerId: owner,
      storeId: randomUUID(),
      taskId: randomUUID(),
    };
    await order.work.register({ ...scope, kind: "individual-service" });
    if (type === "history") {
      await order.work.startServiceDiscussion(scope);
    }
    return entity.id;
  };
  const own = await create(customerId, "history");
  const foreign = await create(randomUUID(), "history");
  const cart = await create(customerId, "cart");
  const outside = await create(customerId, "history");
  const states = await order.work.statesForCustomer(customerId, [
    own,
    foreign,
    cart,
  ]);
  expect(states).toEqual([{ orderId: own, state: "awaiting-result" }]);
  expect(await order.work.statesForCustomer(customerId, [])).toEqual([]);
  expect(await order.work.statesForCustomer(customerId, [outside])).toEqual([
    { orderId: outside, state: "awaiting-result" },
  ]);
});

it("releases a token-funded original once on acceptance without opening checkout", async () => {
  const order = createOrder(createAppAssembly());
  const db = getDrizzle({});
  const entity = await order.create({ data: {} });
  cleanup.push(() => db.delete(Order).where(eq(Order.id, entity.id)));
  const [currency] = await db
    .insert(Currency)
    .values({ slug: `work-${randomUUID()}`, symbol: "T", title: "Token" })
    .returning();
  cleanup.push(() => db.delete(Currency).where(eq(Currency.id, currency.id)));
  const scope = {
    orderId: entity.id,
    taskId: randomUUID(),
    storeId: randomUUID(),
    customerId: randomUUID(),
  };
  await order.work.register({
    ...scope,
    kind: "individual-service",
    paymentMode: "work-tokens",
  });
  await order.work.startServiceDiscussion(scope);
  const input = {
    ...scope,
    actorId: scope.customerId,
    operationKey: randomUUID(),
    currencyId: currency.id,
    price: "0",
    priceBasis: {
      kind: "work-tokens" as const,
      publicationId: randomUUID(),
      stageId: "prepare",
      quotedAt: new Date().toISOString(),
    },
    original: {
      name: "brief.pdf",
      mimeType: "application/pdf",
      bytes: Buffer.from("original"),
    },
    preview: {
      name: "draft.txt",
      mimeType: "text/plain",
      bytes: Buffer.from("draft"),
    },
  };
  const result = await order.work.publishResult(input);
  for (const fileId of [result.originalFileId, result.previewFileId]) {
    cleanup.push(() =>
      order.modules.fileStorage.file.privateContent.delete({ id: fileId }),
    );
  }
  await expect(
    order.work.publishResult({ ...input, operationKey: randomUUID() }),
  ).rejects.toThrow("current draft is still awaiting a decision");
  const selection = { ...scope, fileId: result.id, operationKey: randomUUID() };
  const grant = jest.fn(async () => {});
  await expect(
    order.work.releaseIncludedFile(selection, grant),
  ).rejects.toThrow("no accepted token-funded file");
  await order.work.accept(selection);
  await expect(
    order.work.acceptedCheckout({ ...scope, lines: [] }),
  ).rejects.toThrow("covered by token charges");
  const released = await order.work.releaseIncludedFile(selection, grant);
  expect(released).toMatchObject({
    paid: null,
    receiptFileId: null,
    resultFileId: result.originalFileId,
    state: "delivered",
  });
  expect(await order.work.releaseIncludedFile(selection, grant)).toEqual(
    released,
  );
  expect(grant).toHaveBeenCalledTimes(1);
  expect((await order.findById({ id: scope.orderId }))?.status).toBe(
    "delivered",
  );
});

async function verifySettlement(hasLegacyArchive: boolean) {
  const order = createOrder(createAppAssembly());
  const db = getDrizzle({});
  const entity = await order.create({ data: {} });
  cleanup.push(() => db.delete(Order).where(eq(Order.id, entity.id)));

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
        order.modules.fileStorage.file.privateContent.delete({ id: fileId }),
      );
    }
    return result;
  };
  const second = await createResult(2);
  const first = await createResult(1);
  expect(first.id).toBe(first.previewFileId);
  const attachments = await order.module.ordersToFileStorageModuleFiles.find({
    params: {
      filters: { and: [{ column: "orderId", method: "eq", value: entity.id }] },
    },
  });
  expect(attachments.map((link) => link.fileStorageModuleFileId)).toEqual(
    expect.arrayContaining([
      first.previewFileId,
      first.originalFileId,
      second.previewFileId,
      second.originalFileId,
    ]),
  );
  const [persisted] = await db
    .select({ payload: Order.fulfillmentWork })
    .from(Order)
    .where(eq(Order.id, entity.id));
  expect(persisted.payload).not.toHaveProperty("versions");
  await expect(
    order.work.accept({
      ...scope,
      fileId: second.id,
      operationKey: randomUUID(),
    }),
  ).rejects.toThrow("no longer awaiting review");
  await order.work.accept({
    ...scope,
    fileId: first.id,
    operationKey: randomUUID(),
  });
  const selected = (await order.work.acceptedCheckout(checkout))?.checkout;
  expect(selected).toMatchObject({
    fileId: first.id,
    price: "25.00000000",
  });
  expect((await order.work.resultPriceForOrder(entity.id))?.price).toBe(
    "25.00000000",
  );

  let snapshot: object | undefined = selected;
  if (hasLegacyArchive && selected) {
    const legacyId = randomUUID();
    const work = (await order.work.findByOrder(entity.id))!;
    const { files, acceptedFileId, ...rest } = work;
    const legacy = {
      ...rest,
      acceptedVersionId: legacyId,
      versions: files.map((file, index) => ({
        ...file,
        id: file.id === first.id ? legacyId : file.id,
        number: index + 1,
      })),
      decisions: work.decisions.map(({ fileId, ...decision }) => ({
        ...decision,
        resultVersionId: legacyId,
      })),
    };
    await db
      .update(Order)
      .set({ fulfillmentWork: sql`${JSON.stringify(legacy)}::jsonb` })
      .where(eq(Order.id, entity.id));
    const { fileId, ...fields } = selected;
    snapshot = { ...fields, resultVersionId: legacyId };
    expect((await order.work.acceptedCheckout(checkout))?.checkout.fileId).toBe(
      first.previewFileId,
    );
  }

  const [intent] = await db
    .insert(PaymentIntent)
    .values({
      amount: 24,
      status: "succeeded",
      checkoutCurrencyId: currency.id,
      checkoutMetadata: {
        ecommerceModule: { orders: [{ id: entity.id, orderWork: snapshot }] },
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
  await expect(
    order.work.accept({
      ...scope,
      fileId: second.id,
      operationKey: randomUUID(),
    }),
  ).rejects.toThrow("no longer awaiting review");
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
    fileId: first.id,
    invoiceId: invoice.id,
    paymentIntentId: intent.id,
    customerId: scope.customerId,
  });
  expect(paid?.paid).not.toHaveProperty("expertArchive");
  expect(paid?.expertArchive).toBeNull();
  expect(paid?.acceptedFileId).toBe(first.id);
  expect((await order.work.resultPriceForOrder(entity.id))?.price).toBe(
    "25.00000000",
  );

  const historicalArchive = hasLegacyArchive
    ? [
        {
          sourceId: randomUUID(),
          versionDigest: "old-digest",
          title: "Purchased specification",
          content: "Specification saved at purchase.",
        },
      ]
    : null;
  if (historicalArchive) {
    await order.repository.patchFulfillment(entity.id, {
      expertArchive: historicalArchive,
    });
  }

  const eventId = paid!.paid!.id;
  const saved = { ...scope, eventId };
  const receipt = async () => ({
    name: "receipt.pdf",
    mimeType: "application/pdf",
    bytes: Buffer.from("%PDF-1.4\npaid receipt"),
  });
  let rolledBackFile = "";
  await expect(
    order.work.issueReceipt(
      saved,
      async (_payment, ids) => {
        [rolledBackFile] = ids;
        throw new Error("fixture grant failure");
      },
      receipt,
    ),
  ).rejects.toThrow("fixture grant failure");
  expect((await order.work.findByOrder(entity.id))?.deliveredAt).toBeNull();
  expect(
    await order.modules.fileStorage.file.privateContent.findById({
      id: rolledBackFile,
    }),
  ).toBeNull();
  const { bytes } = await receipt();
  await expect(
    new PrivateDirectory().read(
      rolledBackFile,
      createHash("sha256").update(bytes).digest("hex"),
      bytes.length,
    ),
  ).rejects.toMatchObject({ code: "ENOENT" });

  const grant = jest.fn(async () => {});
  const recorded = await order.work.issueReceipt(saved, grant, receipt);
  cleanup.push(() =>
    order.modules.fileStorage.file.privateContent.delete({
      id: recorded.receiptFileId!,
    }),
  );
  await order.work.issueReceipt(saved, grant, receipt);
  expect(grant).toHaveBeenCalledTimes(1);
  expect(grant).toHaveBeenCalledWith(
    expect.objectContaining({ fileId: first.id }),
    [recorded.receiptFileId],
  );
  expect(recorded.resultFileId).toBeNull();
  expect(recorded.deliveredAt).toBeNull();
  grant.mockClear();
  const selection = { ...saved, fileId: first.id };
  await expect(
    order.work.releasePaidFile({ ...selection, fileId: second.id }, grant),
  ).rejects.toThrow(/accepted and paid/i);
  await expect(
    order.work.releasePaidFile({ ...selection, storeId: randomUUID() }, grant),
  ).rejects.toThrow();
  await db
    .update(Invoice)
    .set({ amount: 26 })
    .where(eq(Invoice.id, invoice.id));
  await expect(order.work.releasePaidFile(selection, grant)).rejects.toThrow(
    /no longer matches/,
  );
  expect(grant).not.toHaveBeenCalled();
  await db
    .update(Invoice)
    .set({ amount: 25 })
    .where(eq(Invoice.id, invoice.id));
  await order.work.releasePaidFile(selection, grant);
  await order.work.releasePaidFile(selection, grant);
  const delivered = (await order.work.findByOrder(entity.id))!;
  expect(delivered.expertArchive).toEqual(historicalArchive);
  expect(grant).toHaveBeenCalledTimes(1);
  expect(grant).toHaveBeenCalledWith(
    expect.objectContaining({ fileId: first.id }),
    [first.originalFileId],
  );
  expect(delivered.resultFileId).toBe(first.originalFileId);
  const file = await order.modules.fileStorage.file.privateContent.findById({
    id: delivered.resultFileId!,
  });
  expect(file?.bytes.toString()).toBe("original 1");
}

it("delivers the accepted order file without publishing the employee’s knowledge", () =>
  verifySettlement(false));
it("preserves the archived specification on a previously paid order through delivery and retry", () =>
  verifySettlement(true));
