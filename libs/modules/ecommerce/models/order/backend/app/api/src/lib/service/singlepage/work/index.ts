import { createHash, randomUUID } from "node:crypto";
import { isDeepStrictEqual } from "node:util";
import {
  logger,
  moneyFromMinorUnits,
  moneyMinorUnits,
} from "@sps/backend-utils";
import { isLegacyOrderReceipt } from "@sps/file-storage/models/file/sdk/model";
import type {
  IDecideOrderWorkResult,
  IDeclineOrderWorkResult,
  IModel as IWork,
  IOrderPhysicalEvidence,
  IAcceptedOrderWorkCheckout,
  IOrderWorkCheckout,
  IOrderWorkOrderLine,
  IOrderWorkPayment,
  IOrderWorkScope,
  IOrderWorkVersion,
  IPublishOrderWorkResult,
  IRegisterOrderWork,
} from "@sps/ecommerce/models/order-work/sdk/model";
import type { Service as Order } from "../index";

function requestHash(value: unknown) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function contentHash(bytes: Uint8Array) {
  return createHash("sha256").update(bytes).digest("hex");
}

export class Service {
  constructor(private readonly order: Order) {}

  private get records() {
    return this.order.module.orderWork;
  }

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
    const record = await this.records.byOrder(input.orderId);
    if (!record) {
      throw new Error("Not Found error. Order work does not exist");
    }

    this.verifyScope(record, input);
    return record;
  }

  private version(record: IWork, versionId: string) {
    const version = record.versions.find(
      (candidate) => candidate.id === versionId,
    );
    if (!version) {
      throw new Error(
        "Not Found error. Result version does not belong to the order",
      );
    }
    return version;
  }

  async register(input: IRegisterOrderWork) {
    return this.order.repository.withLifecycleLock(input.orderId, async () => {
      const order = await this.order.findById({ id: input.orderId });
      if (!order) {
        throw new Error("Not Found error. Order does not exist");
      }

      const previous = await this.records.byOrder(input.orderId);
      if (previous) {
        this.verifyScope(previous, input);
        if (previous.kind !== input.kind) {
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

      const record = await this.records.add({
        ...input,
        state:
          input.kind === "individual-service"
            ? "awaiting-result"
            : "awaiting-payment",
      });
      await this.order.module.ordersToOrderWorks.create({
        data: { orderId: input.orderId, orderWorkId: record.id },
      });
      return record;
    });
  }

  findByOrder(orderId: string) {
    return this.records.byOrder(orderId);
  }

  async isProtectedLegacyReceipt(
    input: { id: string } | { relativePath: string },
  ) {
    const files = this.order.modules.fileStorage.file;
    const [file] =
      "id" in input
        ? [await files.findById({ id: input.id })]
        : await files.find({
            params: {
              filters: {
                and: [
                  {
                    column: "file",
                    method: "inArray",
                    value: [
                      `/${input.relativePath}`,
                      `/public/${input.relativePath}`,
                      input.relativePath,
                    ],
                  },
                ],
              },
              limit: 1,
            },
          });
    if (!file || isLegacyOrderReceipt(file)) {
      return Boolean(file);
    }
    const protectedIds = await this.protectedReceiptFileIds([file.id]);
    return protectedIds.has(file.id);
  }

  async protectedReceiptFileIds(ids: string[]) {
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
    const record = await this.records.byOrder(orderId);
    const versionId =
      record?.paid?.resultVersionId ?? record?.acceptedVersionId;
    if (record?.kind !== "individual-service" || !versionId) {
      return null;
    }
    const { currencyId, price } = this.version(record, versionId);
    return { currencyId, price };
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
      return this.records.revise(record.id, {
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
      const previous = record.versions.find(
        (version) => version.operationKey === input.operationKey,
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
      if (record.kind !== "individual-service" || record.paid) {
        throw new Error(
          "Conflict error. This work cannot accept another result version",
        );
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

      const files = this.order.modules.fileStorage.privateFile;
      const original = await files.write(input.original);
      const preview = await files.write(input.preview);
      const version: IOrderWorkVersion = {
        id: randomUUID(),
        number: record.versions.length + 1,
        actorId: input.actorId,
        operationKey: input.operationKey,
        operationDigest: digest,
        createdAt: new Date().toISOString(),
        originalFileId: original.id,
        previewFileId: preview.id,
        currencyId: input.currencyId,
        price,
        priceBasis: input.priceBasis,
        purchaseQuote: input.purchaseQuote,
      };
      await this.records.revise(record.id, {
        versions: [...record.versions, version],
      });
      return version;
    });
  }

  private async decide(
    input: IDecideOrderWorkResult,
    kind: "accepted" | "declined",
    reason?: string,
  ) {
    return this.order.repository.withLifecycleLock(input.orderId, async () => {
      const record = await this.require(input);
      const version = this.version(record, input.resultVersionId);
      const prior = record.decisions.find(
        (decision) => decision.operationKey === input.operationKey,
      );
      if (prior) {
        if (
          prior.kind !== kind ||
          prior.resultVersionId !== version.id ||
          prior.reason !== reason
        ) {
          throw new Error(
            "Conflict error. This response key belongs to a different decision",
          );
        }
        return record;
      }
      const order = await this.order.findById({ id: input.orderId });
      if (!order || record.paid || !["new", "paying"].includes(order.status)) {
        throw new Error(
          "Conflict error. This order can no longer accept a result decision",
        );
      }

      let acceptedVersionId = record.acceptedVersionId;
      if (kind === "accepted") {
        acceptedVersionId = version.id;
      } else if (record.acceptedVersionId === version.id) {
        acceptedVersionId = null;
      }

      return this.records.revise(record.id, {
        acceptedVersionId,
        state: acceptedVersionId ? "awaiting-payment" : "awaiting-result",
        decisions: [
          ...record.decisions,
          {
            resultVersionId: version.id,
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
    const record = await this.records.byOrder(input.orderId);
    if (record?.kind !== "individual-service") {
      return null;
    }
    if (record.customerId !== input.customerId || record.paid) {
      throw new Error(
        "Conflict error. This work order cannot be checked out by the current customer",
      );
    }
    if (!record.acceptedVersionId) {
      throw new Error(
        "Conflict error. Accept a result version before checkout",
      );
    }

    const version = this.version(record, record.acceptedVersionId);
    const savedLines = version.purchaseQuote?.lines;
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
        resultVersionId: version.id,
        price: version.price,
        currencyId: version.currencyId,
      },
      purchaseQuote: version.purchaseQuote,
    };
  }

  async checkout(input: {
    orderId: string;
    customerId: string;
    price: number;
    currencyId: string;
  }) {
    const record = await this.records.byOrder(input.orderId);
    if (!record) {
      if (await this.requiresAcceptance(input.orderId)) {
        throw new Error(
          "Conflict error. This offer requires a result accepted before checkout",
        );
      }
      return null;
    }
    if (record.customerId !== input.customerId || record.paid) {
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
      resultVersionId: null,
      price,
      currencyId: input.currencyId,
    } satisfies IOrderWorkCheckout;
  }

  async confirmPayment(orderId: string) {
    const record = await this.records.byOrder(orderId);
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
        await this.records.revise(record.id, { paid: payment, state: "paid" });
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
    const snapshot = orders.find(
      (entry) => entry.id === work.orderId,
    )?.orderWork;
    if (
      !snapshot ||
      snapshot.currencyId !== intent.checkoutCurrencyId ||
      orders.length !== 1 ||
      moneyMinorUnits(intent.amount) !== moneyMinorUnits(snapshot.price)
    ) {
      return null;
    }
    this.verifyScope(work, snapshot);

    if (snapshot.resultVersionId) {
      const version = this.version(work, snapshot.resultVersionId);
      if (
        version.price !== snapshot.price ||
        version.currencyId !== snapshot.currencyId
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
    for (const { orderId } of await this.records.missingPayments(limit)) {
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
    const records = await this.records.undeliveredPayments(limit);
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
      await this.records.revise(work.id, { paidDispatchedAt: new Date() });
      count += 1;
    }
    return count;
  }

  async deliver(
    input: { orderId: string; eventId: string },
    grant: (
      snapshot: IOrderWorkPayment,
      artifactIds: string[],
    ) => Promise<void>,
    receipt: (
      event: IOrderWorkPayment,
    ) => Promise<{ name: string; mimeType: string; bytes: Uint8Array }>,
  ) {
    return this.order.repository.withLifecycleLock(input.orderId, async () => {
      const work = await this.records.byOrder(input.orderId);
      if (!work?.paid || work.paid.id !== input.eventId) {
        throw new Error("Not Found error. Order payment event does not exist");
      }
      if (work.deliveredAt) {
        return work;
      }
      const payment = await this.settlement(
        work,
        work.paid.paymentIntentId,
        work.paid.invoiceId,
      );
      if (
        !payment ||
        payment.invoiceId !== work.paid.invoiceId ||
        payment.resultVersionId !== work.paid.resultVersionId
      ) {
        throw new Error(
          "Conflict error. Payment no longer matches its order snapshot",
        );
      }
      const receiptFile =
        await this.order.modules.fileStorage.privateFile.write(
          await receipt(payment),
        );
      const artifacts = [receiptFile.id];
      let resultFileId: string | null = null;
      if (payment.resultVersionId) {
        const version = this.version(work, payment.resultVersionId);
        resultFileId = version.originalFileId;
        artifacts.push(resultFileId);
      }
      await grant(payment, artifacts);

      if (resultFileId) {
        await this.order.update({
          id: work.orderId,
          data: { status: "delivered" },
        });
      }

      return this.records.revise(work.id, {
        receiptFileId: receiptFile.id,
        resultFileId,
        deliveredAt: new Date(),
        state: resultFileId ? "delivered" : work.state,
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
      await this.records.revise(work.id, {
        state: input.stage,
        fulfillment: [...work.fulfillment, event],
      });
      return event;
    });
  }
}
