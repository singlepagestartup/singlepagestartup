import { createHash, randomUUID } from "node:crypto";
import { isDeepStrictEqual } from "node:util";
import {
  assertSingleUnitPerOrder,
  logger,
  moneyFromMinorUnits,
  moneyMinorUnits,
} from "@sps/backend-utils";
import { isLegacyOrderReceipt } from "@sps/file-storage/models/file/sdk/model";
import type {
  IDecideOrderWorkResult,
  IDeclineOrderWorkResult,
  IOrderWork as IWork,
  IOrderPhysicalEvidence,
  IAcceptedOrderWorkCheckout,
  IOrderWorkCheckout,
  IOrderWorkOrderLine,
  IOrderWorkPayment,
  IOrderWorkScope,
  IOrderWorkFile,
  IPublishOrderWorkResult,
  IRegisterOrderWork,
} from "@sps/ecommerce/models/order/sdk/model";
import type { Service as Order } from "../index";

function requestHash(value: unknown) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function contentHash(bytes: Uint8Array) {
  return createHash("sha256").update(bytes).digest("hex");
}

export class Service {
  constructor(private readonly order: Order) {}

  withOrderLock<T>(orderId: string, operation: () => Promise<T>) {
    return this.order.repository.withLifecycleLock(orderId, operation);
  }

  private verifyScope(record: IWork, input: IOrderWorkScope) {
    if (
      record.orderId !== input.orderId ||
      record.taskId !== input.taskId ||
      record.customerId !== input.customerId ||
      record.storeId !== input.storeId
    ) {
      throw new Error(
        "Not Found error. Order work does not belong to this purchase",
      );
    }
  }

  private async require(input: IOrderWorkScope) {
    const record = await this.order.repository.fulfillmentForOrder(
      input.orderId,
    );
    if (!record) {
      throw new Error("Not Found error. Order work does not exist");
    }

    this.verifyScope(record, input);
    return record;
  }

  private file(record: IWork, fileId: string) {
    const file = record.files.find(
      (candidate) =>
        candidate.id === fileId || candidate.legacyMessageId === fileId,
    );
    if (!file) {
      throw new Error(
        "Not Found error. Result file does not belong to the order",
      );
    }
    return file;
  }

  assertCurrentFile(record: IWork, file: IOrderWorkFile) {
    const changesRequested = record.decisions.some(
      (decision) => decision.fileId === file.id && decision.kind === "declined",
    );
    if (
      record.files.at(-1)?.id !== file.id ||
      file.invalidatedByCartEdit ||
      changesRequested
    ) {
      throw new Error("Conflict error. This file is no longer awaiting review");
    }
  }

  async register(input: IRegisterOrderWork) {
    return this.order.repository.withLifecycleLock(input.orderId, async () => {
      const order = await this.order.findById({ id: input.orderId });
      if (!order) {
        throw new Error("Not Found error. Order does not exist");
      }

      const previous = await this.order.repository.fulfillmentForOrder(
        input.orderId,
      );
      if (previous) {
        this.verifyScope(previous, input);
        if (
          previous.kind !== input.kind ||
          previous.paymentMode !== input.paymentMode
        ) {
          throw new Error(
            "Conflict error. Another work type is active for the order",
          );
        }
        return previous;
      }
      if (order.status !== "new" || order.type !== "cart") {
        throw new Error(
          "Conflict error. Work can be registered only on a new draft order",
        );
      }

      const now = new Date().toISOString();
      const record: IWork = {
        id: randomUUID(),
        createdAt: now,
        updatedAt: now,
        files: [],
        decisions: [],
        fulfillment: [],
        acceptedFileId: null,
        paid: null,
        expertArchive: null,
        deliveredAt: null,
        receiptFileId: null,
        resultFileId: null,
        paidDispatchedAt: null,
        ...input,
        state:
          input.kind === "individual-service"
            ? "awaiting-result"
            : "awaiting-payment",
      };
      return this.order.repository.saveFulfillment(input.orderId, record);
    });
  }

  async startServiceDiscussion(input: IOrderWorkScope) {
    await this.order.repository.withLifecycleLock(input.orderId, async () => {
      const work = await this.require(input);
      if (work.kind !== "individual-service") {
        return;
      }
      const order = await this.order.findById({ id: input.orderId });
      if (order?.type === "cart" && order.status === "new" && !work.paid) {
        await this.order.update({
          id: input.orderId,
          data: { type: "history", status: "delivering" },
        });
      }
    });
  }

  statesForCustomer(customerId: string, orderIds: string[]) {
    return this.order.repository.fulfillmentStatesForCustomer(
      customerId,
      orderIds,
    );
  }

  findByOrder(orderId: string) {
    return this.order.repository.fulfillmentForOrder(orderId);
  }

  async isProtectedLegacyReceipt(input: { relativePath: string }) {
    const files =
      await this.order.modules.fileStorage.file.findStoredObjectMetadata([
        input.relativePath,
      ]);
    if (files.some(isLegacyOrderReceipt)) {
      return true;
    }
    const protectedIds = await this.linkedReceiptFileIds(
      files.map(({ id }) => id),
    );
    return protectedIds.size > 0;
  }

  async protectedReceiptFileIds(files: Array<{ id: string; file: string }>) {
    const storage = this.order.modules.fileStorage.file;
    const metadata = await storage.findStoredObjectMetadata(
      files.map(({ file }) => file),
    );
    const ids = [...new Set([...files, ...metadata].map(({ id }) => id))];
    const linkedIds = await this.linkedReceiptFileIds(ids);
    const protectedLocations = new Set(
      metadata
        .filter((file) => isLegacyOrderReceipt(file) || linkedIds.has(file.id))
        .map(({ file }) => storage.storedObjectKey(file)),
    );
    return new Set(
      files
        .filter(
          ({ id, file }) =>
            linkedIds.has(id) ||
            protectedLocations.has(storage.storedObjectKey(file)),
        )
        .map(({ id }) => id),
    );
  }

  private async linkedReceiptFileIds(ids: string[]) {
    if (!ids.length) {
      return new Set<string>();
    }
    const links = await this.order.module.ordersToFileStorageModuleFiles.find({
      params: {
        filters: {
          and: [
            {
              column: "fileStorageModuleFileId",
              method: "inArray",
              value: ids,
            },
            { column: "variant", method: "eq", value: "receipt-default" },
          ],
        },
      },
    });
    return new Set(
      links.flatMap((link) =>
        !link.privateReceiptFileId || link.legacyReceiptLocation
          ? [link.fileStorageModuleFileId]
          : [],
      ),
    );
  }

  private async requiresAcceptance(orderId: string) {
    const lines = await this.order.module.ordersToProducts.find({
      params: {
        filters: { and: [{ column: "orderId", method: "eq", value: orderId }] },
      },
    });
    const offerIds = lines.flatMap((line) =>
      line.offerId && !line.parentLineId ? [line.offerId] : [],
    );
    if (!offerIds.length) {
      return false;
    }
    const offers = await this.order.module.storesToProducts.find({
      params: {
        filters: {
          and: [{ column: "id", method: "inArray", value: offerIds }],
        },
      },
    });
    return offers.some(
      (offer) => offer.settings.requiresResultAcceptance === true,
    );
  }

  read(input: IOrderWorkScope) {
    return this.require(input);
  }

  async resultPriceForOrder(orderId: string) {
    const record = await this.order.repository.fulfillmentForOrder(orderId);
    const fileId = record?.paid?.fileId ?? record?.acceptedFileId;
    if (
      record?.kind !== "individual-service" ||
      record.paymentMode === "work-tokens" ||
      !fileId
    ) {
      return null;
    }
    const { currencyId, price } = this.file(record, fileId);
    return { currencyId, price };
  }

  async invalidateCartResults(orderId: string) {
    return this.withOrderLock(orderId, async () => {
      const record = await this.order.repository.fulfillmentForOrder(orderId);
      if (
        record?.kind !== "individual-service" ||
        record.state === "canceled" ||
        record.paid ||
        !record.files.length
      ) {
        return;
      }
      await this.order.repository.patchFulfillment(record.orderId, {
        acceptedFileId: null,
        state: "awaiting-result",
        files: record.files.map((file) => ({
          ...file,
          invalidatedByCartEdit: true,
        })),
      });
    });
  }

  async assertResultQuantitySnapshot(orderId: string, file: IOrderWorkFile) {
    if (file.invalidatedByCartEdit) {
      throw new Error(
        "Conflict error. The cart changed. A new result is required",
      );
    }
    const primary = await this.order.module.ordersToProducts.find({
      params: {
        filters: {
          and: [
            { column: "orderId", method: "eq", value: orderId },
            { column: "parentLineId", method: "isNull", value: null },
          ],
        },
      },
    });
    for (const line of primary) {
      const product = await this.order.module.product.findById({
        id: line.productId,
      });
      if (!product?.singleUnitPerOrder) {
        continue;
      }
      assertSingleUnitPerOrder(product, line.quantity);
      const quoted = file.purchaseQuote?.lines.find(
        (entry) => entry.id === line.id && !entry.parentLineId,
      );
      if (
        quoted?.quantity !== line.quantity ||
        quoted.offerId !== line.offerId
      ) {
        throw new Error(
          "Conflict error. This result used different order quantities. A new result is required",
        );
      }
    }
  }

  async transferCustomer(input: IOrderWorkScope & { nextCustomerId: string }) {
    return this.order.repository.withLifecycleLock(input.orderId, async () => {
      const record = await this.require(input);
      const order = await this.order.findById({ id: record.orderId });
      if (
        !order ||
        order.type !== "cart" ||
        order.status !== "new" ||
        record.paid
      ) {
        throw new Error(
          "Conflict error. Only an unpaid draft can change customer",
        );
      }
      return this.order.repository.patchFulfillment(record.orderId, {
        customerId: input.nextCustomerId,
      });
    });
  }

  async publishResult(input: IPublishOrderWorkResult) {
    return this.order.repository.withLifecycleLock(input.orderId, async () => {
      const record = await this.require(input);
      const price = moneyFromMinorUnits(moneyMinorUnits(input.price)).toFixed(
        8,
      );

      const originalDigest = contentHash(input.original.bytes);
      const previewDigest = contentHash(input.preview.bytes);
      if (originalDigest === previewDigest) {
        throw new Error(
          "Validation error. The original and preview must contain different bytes",
        );
      }
      const digest = requestHash({
        currencyId: input.currencyId,
        price,
        actorId: input.actorId,
        originalDigest,
        previewDigest,
        originalName: input.original.name,
        previewName: input.preview.name,
        originalMime: input.original.mimeType,
        previewMime: input.preview.mimeType,
      });
      const previous = record.files.find(
        (file) => file.operationKey === input.operationKey,
      );
      if (previous) {
        const priced = JSON.parse(
          JSON.stringify({
            priceBasis: input.priceBasis,
            purchaseQuote: input.purchaseQuote,
          }),
        );
        if (
          previous.operationDigest !== digest ||
          !isDeepStrictEqual(previous.priceBasis, priced.priceBasis) ||
          !isDeepStrictEqual(previous.purchaseQuote, priced.purchaseQuote)
        ) {
          throw new Error(
            "Conflict error. Result operation already belongs to different content",
          );
        }
        return previous;
      }
      if (
        record.kind !== "individual-service" ||
        record.state === "canceled" ||
        record.paid ||
        record.acceptedFileId
      ) {
        throw new Error(
          "Conflict error. This order cannot accept another result file",
        );
      }
      if (
        (record.paymentMode === "work-tokens") !==
        (input.priceBasis?.kind === "work-tokens")
      ) {
        throw new Error(
          "Conflict error. The result price does not match the order's payment terms",
        );
      }
      if (record.paymentMode === "work-tokens") {
        if (
          input.preview.mimeType !== "text/plain" ||
          input.original.mimeType !== "application/pdf" ||
          Number(price) !== 0
        ) {
          throw new Error(
            "Validation error. Token-funded results require a text draft and an included PDF original",
          );
        }
        const latest = record.files.at(-1);
        if (
          latest &&
          !latest.invalidatedByCartEdit &&
          !record.decisions.some(
            (decision) =>
              decision.fileId === latest.id && decision.kind === "declined",
          )
        ) {
          throw new Error(
            "Conflict error. The current draft is still awaiting a decision",
          );
        }
      }
      if (input.purchaseQuote) {
        const total = input.purchaseQuote.charges.reduce(
          (sum, charge) => sum + moneyMinorUnits(charge.amount),
          0n,
        );
        if (total !== moneyMinorUnits(price)) {
          throw new Error(
            "Validation error. Quoted charges must match the result price",
          );
        }
      }

      const currency = await this.order.modules.billing.currency.findById({
        id: input.currencyId,
      });
      if (!currency) {
        throw new Error("Not Found error. Result currency does not exist");
      }
      const order = await this.order.findById({ id: input.orderId });
      if (!order) {
        throw new Error("Conflict error. This order has been removed");
      }

      const files = this.order.modules.fileStorage.file.privateContent;
      const original = await files.write({
        ...input.original,
        ownerId: input.actorId,
      });
      const preview = await files.write({
        ...input.preview,
        ownerId: input.actorId,
      });
      for (const [fileId, variant] of [
        [preview.id, "result-preview"],
        [original.id, "result-original"],
      ]) {
        await this.order.module.ordersToFileStorageModuleFiles.create({
          data: {
            orderId: record.orderId,
            fileStorageModuleFileId: fileId,
            variant,
          },
        });
      }
      const file: IOrderWorkFile = {
        id: preview.id,
        actorId: input.actorId,
        operationKey: input.operationKey,
        operationDigest: digest,
        createdAt: new Date().toISOString(),
        originalFileId: original.id,
        previewFileId: preview.id,
        previewMimeType: input.preview.mimeType,
        previewName: input.preview.name,
        originalName: input.original.name,
        originalMimeType: input.original.mimeType,
        currencyId: input.currencyId,
        price,
        priceBasis: input.priceBasis,
        purchaseQuote: input.purchaseQuote,
      };
      await this.order.repository.patchFulfillment(record.orderId, {
        files: [...record.files, file],
      });
      return file;
    });
  }

  private async decide(
    input: IDecideOrderWorkResult,
    kind: "accepted" | "declined",
    reason?: string,
  ) {
    return this.order.repository.withLifecycleLock(input.orderId, async () => {
      const record = await this.require(input);
      const file = this.file(record, input.fileId);
      const prior = record.decisions.find(
        (decision) => decision.operationKey === input.operationKey,
      );
      if (prior) {
        if (
          prior.kind !== kind ||
          prior.fileId !== file.id ||
          prior.reason !== reason
        ) {
          throw new Error(
            "Conflict error. This response key belongs to a different decision",
          );
        }
        return record;
      }
      this.assertCurrentFile(record, file);
      if (record.acceptedFileId === file.id && kind === "accepted") {
        return record;
      }
      if (record.acceptedFileId) {
        throw new Error("Conflict error. This order file was already accepted");
      }
      const order = await this.order.findById({ id: input.orderId });
      if (
        !order ||
        record.paid ||
        !(
          ["new", "paying"].includes(order.status) ||
          (record.kind === "individual-service" &&
            order.type === "history" &&
            order.status === "delivering")
        )
      ) {
        throw new Error(
          "Conflict error. This order can no longer accept a result decision",
        );
      }

      if (kind === "accepted") {
        await this.assertResultQuantitySnapshot(input.orderId, file);
      }
      const acceptedFileId = kind === "accepted" ? file.id : null;

      return this.order.repository.patchFulfillment(record.orderId, {
        acceptedFileId,
        state: acceptedFileId
          ? record.paymentMode === "work-tokens"
            ? "accepted"
            : "awaiting-payment"
          : "awaiting-result",
        decisions: [
          ...record.decisions,
          {
            fileId: file.id,
            operationKey: input.operationKey,
            receivedAt: new Date().toISOString(),
            kind,
            reason,
          },
        ],
      });
    });
  }

  accept(input: IDecideOrderWorkResult) {
    return this.decide(input, "accepted");
  }

  decline(input: IDeclineOrderWorkResult) {
    const reason = input.reason.trim();
    if (!reason || reason.length > 4000) {
      throw new Error(
        "Validation error. Give a reason for declining this result",
      );
    }
    return this.decide(input, "declined", reason);
  }

  async acceptedCheckout(input: {
    orderId: string;
    customerId: string;
    lines: Array<{
      id: string;
      offerId: string | null;
      quantity: number;
      parentLineId?: string | null;
    }>;
  }): Promise<IAcceptedOrderWorkCheckout | null> {
    const record = await this.order.repository.fulfillmentForOrder(
      input.orderId,
    );
    if (record?.kind !== "individual-service") {
      return null;
    }
    if (record.paymentMode === "work-tokens") {
      throw new Error(
        "Conflict error. This order is covered by token charges for work",
      );
    }
    if (
      record.customerId !== input.customerId ||
      record.paid ||
      record.state === "canceled"
    ) {
      throw new Error(
        "Conflict error. This work order cannot be checked out by the current customer",
      );
    }
    if (!record.acceptedFileId) {
      throw new Error("Conflict error. Accept a result file before checkout");
    }

    const file = this.file(record, record.acceptedFileId);
    const savedLines = file.purchaseQuote?.lines;
    if (
      savedLines &&
      (savedLines.length !== input.lines.length ||
        !savedLines.every((line: IOrderWorkOrderLine) =>
          input.lines.some(
            (current) =>
              current.id === line.id &&
              current.offerId === line.offerId &&
              current.quantity === line.quantity &&
              (current.parentLineId ?? null) === line.parentLineId,
          ),
        ))
    ) {
      throw new Error(
        "Conflict error. Order lines differ from the accepted result",
      );
    }
    return {
      checkout: {
        orderId: record.orderId,
        customerId: record.customerId,
        taskId: record.taskId,
        storeId: record.storeId,
        fileId: file.id,
        price: file.price,
        currencyId: file.currencyId,
      },
      purchaseQuote: file.purchaseQuote,
    };
  }

  async checkout(input: {
    orderId: string;
    customerId: string;
    price: number;
    currencyId: string;
  }) {
    const record = await this.order.repository.fulfillmentForOrder(
      input.orderId,
    );
    if (!record) {
      if (await this.requiresAcceptance(input.orderId)) {
        throw new Error(
          "Conflict error. This offer requires a result accepted before checkout",
        );
      }
      return null;
    }
    if (
      record.customerId !== input.customerId ||
      record.paid ||
      record.state === "canceled"
    ) {
      throw new Error(
        "Conflict error. This work order cannot be checked out by the current customer",
      );
    }

    if (record.kind === "individual-service") {
      throw new Error(
        "Conflict error. Checkout requires an accepted result snapshot",
      );
    }

    const price = moneyFromMinorUnits(moneyMinorUnits(input.price)).toFixed(8);
    return {
      orderId: input.orderId,
      customerId: record.customerId,
      taskId: record.taskId,
      storeId: record.storeId,
      fileId: null,
      price,
      currencyId: input.currencyId,
    } satisfies IOrderWorkCheckout;
  }

  async confirmPayment(orderId: string) {
    const record = await this.order.repository.fulfillmentForOrder(orderId);
    if (!record || record.paid) {
      return record?.paid;
    }
    const links = await this.order.ordersToBillingModulePaymentIntents.find({
      params: {
        filters: { and: [{ column: "orderId", method: "eq", value: orderId }] },
      },
    });
    for (const id of new Set(
      links.map((link) => link.billingModulePaymentIntentId),
    )) {
      const payment = await this.settlement(record, id);
      if (payment) {
        await this.order.repository.patchFulfillment(record.orderId, {
          paid: payment,
          state: record.state === "canceled" ? "canceled" : "paid",
        });
        return payment;
      }
    }

    throw new Error(
      "Conflict error. The confirmed payment does not match an authorized order attempt",
    );
  }

  private async settlement(
    work: IWork,
    paymentIntentId: string,
    expectedInvoiceId?: string,
  ): Promise<IOrderWorkPayment | null> {
    const intent = await this.order.paymentIntent.findById({
      id: paymentIntentId,
    });
    if (
      !intent ||
      intent.status !== "succeeded" ||
      !intent.checkoutCurrencyId
    ) {
      return null;
    }
    const metadata = intent.checkoutMetadata as {
      ecommerceModule?: {
        orders?: Array<{ id: string; orderWork?: IOrderWorkCheckout }>;
      };
    } | null;
    const orders = metadata?.ecommerceModule?.orders ?? [];
    const stored = orders.find((entry) => entry.id === work.orderId)?.orderWork;
    let snapshot: IOrderWorkCheckout | undefined;
    if (stored) {
      const { resultVersionId, ...fields } = stored as IOrderWorkCheckout & {
        resultVersionId?: string | null;
      };
      const reference = fields.fileId ?? resultVersionId;
      snapshot = {
        ...fields,
        fileId: reference ? this.file(work, reference).id : null,
      };
    }
    if (
      !snapshot ||
      snapshot.currencyId !== intent.checkoutCurrencyId ||
      orders.length !== 1 ||
      moneyMinorUnits(intent.amount) !== moneyMinorUnits(snapshot.price)
    ) {
      return null;
    }
    this.verifyScope(work, snapshot);

    if (snapshot.fileId) {
      const file = this.file(work, snapshot.fileId);
      if (
        file.price !== snapshot.price ||
        file.currencyId !== snapshot.currencyId
      ) {
        return null;
      }
    } else if (work.kind === "individual-service") {
      return null;
    }

    const invoiceLinks =
      await this.order.paymentIntent.module.paymentIntentsToInvoices.find({
        params: {
          filters: {
            and: [
              {
                column: "paymentIntentId",
                method: "eq",
                value: paymentIntentId,
              },
            ],
          },
        },
      });
    if (!invoiceLinks.length) {
      return null;
    }
    const invoices = await this.order.paymentIntent.module.invoice.find({
      params: {
        filters: {
          and: [
            {
              column: "id",
              method: "inArray",
              value: invoiceLinks.map((link) => link.invoiceId),
            },
          ],
        },
      },
    });
    const eligible = invoices.filter(
      (entry) =>
        entry.status === "paid" &&
        moneyMinorUnits(entry.amount) === moneyMinorUnits(intent.amount) &&
        (!expectedInvoiceId || entry.id === expectedInvoiceId),
    );
    if (eligible.length !== 1) {
      return null;
    }
    const [invoice] = eligible;

    return {
      ...snapshot,
      id: work.paid?.id ?? randomUUID(),
      paidAt: work.paid?.paidAt ?? new Date().toISOString(),
      invoiceId: invoice.id,
      paymentIntentId,
    };
  }

  async publishPaymentEvents(channelId: string, limit = 50) {
    if (!Number.isSafeInteger(limit) || limit < 1 || limit > 200) {
      throw new Error("Validation error. Invalid order payment outbox limit");
    }
    for (const { orderId } of await this.order.repository.missingPayments(
      limit,
    )) {
      try {
        await this.order.repository.withLifecycleLock(orderId, () =>
          this.confirmPayment(orderId),
        );
      } catch {
        logger.warn({
          event: "ecommerce.order-work.payment-repair-failed",
          orderId,
        });
      }
    }
    const queue = this.order.modules.broadcast.channel.queue;
    const records = await this.order.repository.undeliveredPayments(limit);
    let count = 0;
    for (const work of records) {
      if (!work.paid) {
        continue;
      }
      await queue.publish({
        channelId,
        key: `order-work-payment:${work.paid.id}`,
        payload: JSON.stringify(work.paid),
      });
      await this.order.repository.patchFulfillment(work.orderId, {
        paidDispatchedAt: new Date().toISOString(),
      });
      count += 1;
    }
    return count;
  }

  private async verifiedPayment(work: IWork, eventId: string) {
    if (!work.paid || work.paid.id !== eventId) {
      throw new Error("Conflict error. The order payment is not confirmed");
    }
    const paid = await this.settlement(
      work,
      work.paid.paymentIntentId,
      work.paid.invoiceId,
    );
    if (
      !paid ||
      paid.invoiceId !== work.paid.invoiceId ||
      paid.fileId !== work.paid.fileId
    ) {
      throw new Error(
        "Conflict error. Payment no longer matches its order snapshot",
      );
    }
    return paid;
  }

  async issueReceipt(
    input: IOrderWorkScope & { eventId: string },
    grant: (payment: IOrderWorkPayment, ids: string[]) => Promise<void>,
    receipt: (
      payment: IOrderWorkPayment,
    ) => Promise<{ name: string; mimeType: string; bytes: Uint8Array }>,
  ) {
    return this.withOrderLock(input.orderId, async () => {
      const work = await this.require(input);
      if (work.paid?.id === input.eventId && work.receiptFileId) {
        return work;
      }
      const paid = await this.verifiedPayment(work, input.eventId);
      const document = await receipt(paid);
      const stored =
        await this.order.modules.fileStorage.file.privateContent.write(
          document,
        );
      await grant(paid, [stored.id]);
      return this.order.repository.patchFulfillment(input.orderId, {
        receiptFileId: stored.id,
        ...(!paid.fileId && { deliveredAt: new Date().toISOString() }),
      });
    });
  }

  async releasePaidFile(
    input: IOrderWorkScope & { eventId: string; fileId: string },
    grant: (payment: IOrderWorkPayment, ids: string[]) => Promise<void>,
  ) {
    return this.withOrderLock(input.orderId, async () => {
      const work = await this.require(input);
      const paid = await this.verifiedPayment(work, input.eventId);
      if (
        paid.fileId !== input.fileId ||
        work.acceptedFileId !== input.fileId
      ) {
        throw new Error(
          "Conflict error. This file was not accepted and paid for in this order",
        );
      }
      const file = this.file(work, input.fileId);
      if (work.deliveredAt && work.resultFileId === file.originalFileId) {
        return file;
      }
      if (work.state === "canceled") {
        throw new Error("Conflict error. This order was canceled");
      }
      await grant(paid, [file.originalFileId]);
      await this.order.update({
        id: input.orderId,
        data: { status: "delivered" },
      });
      await this.order.repository.patchFulfillment(input.orderId, {
        resultFileId: file.originalFileId,
        deliveredAt: new Date().toISOString(),
        state: "delivered",
      });
      return file;
    });
  }

  async releaseIncludedFile(
    input: IOrderWorkScope & { fileId: string },
    grant: (scope: IOrderWorkScope, ids: string[]) => Promise<void>,
  ) {
    return this.withOrderLock(input.orderId, async () => {
      const work = await this.require(input);
      if (
        work.paymentMode !== "work-tokens" ||
        work.acceptedFileId !== input.fileId ||
        !["accepted", "delivered"].includes(work.state)
      ) {
        throw new Error(
          "Conflict error. The order has no accepted token-funded file",
        );
      }
      const file = this.file(work, input.fileId);
      if (work.deliveredAt && work.resultFileId === file.originalFileId) {
        return work;
      }
      await grant(input, [file.originalFileId]);
      await this.order.update({
        id: input.orderId,
        data: { status: "delivered" },
      });
      return this.order.repository.patchFulfillment(input.orderId, {
        resultFileId: file.originalFileId,
        deliveredAt: new Date().toISOString(),
        state: "delivered",
      });
    });
  }

  async fulfill(input: IOrderPhysicalEvidence) {
    return this.order.repository.withLifecycleLock(input.orderId, async () => {
      const work = await this.require(input);
      const previous = work.fulfillment.find(
        (event) => event.operationKey === input.operationKey,
      );
      if (previous) {
        if (
          previous.stage !== input.stage ||
          previous.actorId !== input.actorId ||
          previous.trackingNumber !== input.trackingNumber ||
          previous.carrierEvidenceId !== input.carrierEvidenceId
        ) {
          throw new Error(
            "Conflict error. Fulfillment operation already belongs to a different event",
          );
        }
        return previous;
      }
      if (work.state === "canceled") {
        throw new Error("Conflict error. This order was canceled");
      }
      if (work.kind !== "physical-order" || !work.paid) {
        throw new Error(
          "Conflict error. Physical fulfillment requires a paid physical order",
        );
      }
      if (input.stage === "preparing" && work.state !== "paid") {
        throw new Error("Conflict error. The order is not ready to prepare");
      }
      if (
        input.stage === "in-transit" &&
        (work.state !== "preparing" || !input.trackingNumber?.trim())
      ) {
        throw new Error(
          "Conflict error. Shipment requires a prepared order and tracking number",
        );
      }
      if (
        input.stage === "delivered" &&
        (work.state !== "in-transit" || !input.carrierEvidenceId?.trim())
      ) {
        throw new Error(
          "Conflict error. Delivery requires carrier confirmation for a shipped order",
        );
      }
      const event = {
        id: randomUUID(),
        operationKey: input.operationKey,
        actorId: input.actorId,
        createdAt: new Date().toISOString(),
        stage: input.stage,
        trackingNumber: input.trackingNumber,
        carrierEvidenceId: input.carrierEvidenceId,
      };
      const status = {
        preparing: "packaging",
        "in-transit": "delivering",
        delivered: "delivered",
      }[input.stage];
      await this.order.update({ id: work.orderId, data: { status } });
      await this.order.repository.patchFulfillment(work.orderId, {
        state: input.stage,
        fulfillment: [...work.fulfillment, event],
      });
      return event;
    });
  }
}
