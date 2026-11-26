import { protectedFileContentPath } from "@sps/rbac/models/subject/sdk/model/src/lib/protected-file";
import { randomUUID } from "node:crypto";
import { jsPDF } from "jspdf";
import type { IModel as ITask } from "@sps/crm/models/task/sdk/model";
import type { IFunnelStage } from "@sps/crm/models/stage/sdk/model";
import { isOrderPaymentStage } from "@sps/crm/models/funnel/sdk/model";
import { currencyPrecision } from "@sps/billing/models/currency/sdk/model";
import {
  deliveredOrderWorkFile,
  orderStatusLabel,
} from "@sps/ecommerce/models/order/sdk/model";
import {
  FILE_PREVIEW_TEXT_MAX_BYTES,
  isSupportedAiChatAttachment,
} from "@sps/shared-utils";
import type {
  IModel as Order,
  IOrderWork,
  IOrderWorkArtifact,
  IOrderWorkFile,
  IOrderWorkPayment,
  IOrderWorkPurchaseQuote,
  TOrderWorkPriceBasis,
  IOrderWorkScope as IInternalScope,
  IOrderPhysicalEvidence,
} from "@sps/ecommerce/models/order/sdk/model";
import {
  orderArtifactPath,
  orderFileFeedbackOperationKey,
  orderResultFiles,
  type IOrderArtifact,
  type IOrderArtifactKnowledge,
  type IOrderWorkScope,
  type IOrderWorkView,
  type TOrderWorkDecision,
} from "@sps/rbac/models/subject/sdk/model/src/lib/order-work";
import type { Service as Subject } from "../../../index";
import { Service as PersonalSources } from "../../../social-module/profile/knowledge/personal";
import {
  calculateConfirmedResultPrice,
  imageOrderResult,
  pdfOrderResult,
  priceResultCharges,
  readOrderPdfText,
} from "./utils";
import { LegacyReceipts } from "./receipts";

interface IPurchase extends IOrderWorkScope {
  orderId: string;
}

interface IProduceOrderResult extends IOrderWorkScope {
  assigneeId: string;
  assignmentRevision: number;
  attemptId: string;
  original: IOrderWorkArtifact;
  preview: IOrderWorkArtifact;
}

export class Service {
  constructor(private readonly subject: Subject) {}

  get legacyReceipts() {
    return new LegacyReceipts({
      subject: this.subject,
      owner: (orderId) => this.receiptOwner(orderId),
      grant: (purchase, fileIds) => this.grantFiles(purchase, fileIds),
    });
  }

  private get work() {
    return this.subject.modules.ecommerce.order.work;
  }

  private scope(customerId: string, input: IPurchase): IInternalScope {
    return {
      customerId,
      orderId: input.orderId,
      storeId: input.storeId,
      taskId: input.taskId,
    };
  }

  private async orderChat(order: Order) {
    const { crm, ecommerce } = this.subject.modules;
    let current: Order | null = order;
    const visited = new Set<string>();
    const owner = await this.receiptOwner(order.id);
    if (!owner) {
      return;
    }
    while (current && !visited.has(current.id)) {
      visited.add(current.id);
      const tasks = await crm.task.find({
        params: {
          limit: 2,
          filters: {
            and: [
              { column: "orderId", method: "eq", value: current.id },
              { column: "customerId", method: "eq", value: owner },
            ],
          },
        },
      });
      if (tasks.length) {
        const [task] = tasks;
        if (
          tasks.length === 1 &&
          (await this.subject.customerWork.workspaceChannel(task))
        ) {
          return task;
        }
        return;
      }
      if (!current.subscriptionSourceOrderId) {
        return;
      }
      current = await ecommerce.order.findById({
        id: current.subscriptionSourceOrderId,
      });
    }
    return undefined;
  }

  async postStatusChange(order: Order, previousStatus: string) {
    // The confirmed payment event carries the exact amount for a work order.
    if (order.status === "paid" && (await this.work.findByOrder(order.id))) {
      return;
    }
    const task = await this.orderChat(order);
    if (task) {
      const periodEnded =
        order.subscriptionPeriodEndsAt &&
        order.subscriptionPeriodInvoiceId &&
        new Date(order.subscriptionPeriodEndsAt).getTime() <= Date.now() &&
        ["delivered", "expired", "canceling"].includes(order.status);
      const text = periodEnded
        ? `Период подписки закончился. Статус заказа — «${orderStatusLabel(order.status, "ru")}».`
        : `Статус заказа изменился с «${orderStatusLabel(previousStatus, "ru")}» на «${orderStatusLabel(order.status, "ru")}».`;
      await this.subject.customerWork.postOrderNotice(task, {
        key: `order-status:${order.id}:${randomUUID()}`,
        source: "order-status",
        text,
      });
    }
  }

  async postRenewalInvoice(orderId: string, subjectId: string) {
    const { ecommerce } = this.subject.modules;
    const order = await ecommerce.order.findById({ id: orderId });
    if (
      !order?.subscriptionSourceOrderId ||
      order.subscriptionPeriodInvoiceId
    ) {
      return;
    }
    const task = await this.orderChat(order);
    if (!task || task.customerId !== subjectId) {
      return;
    }
    await ecommerce.order.repository.withLifecycleLock(order.id, async () => {
      const current = await ecommerce.order.findByIdExtended({ id: order.id });
      if (
        current.subscriptionPeriodInvoiceId ||
        ["canceled", "canceling", "paid", "completed"].includes(current.status)
      ) {
        return;
      }
      for (const {
        billingModulePaymentIntent,
      } of current.ordersToBillingModulePaymentIntents) {
        for (const {
          invoice,
        } of billingModulePaymentIntent.paymentIntentsToInvoices) {
          if (invoice.status !== "open") {
            continue;
          }
          await this.subject.customerWork.postOrderNotice(task, {
            key: `order-renewal:${invoice.id}`,
            source: "order-renewal",
            text: `Выставлен счёт на следующий период подписки. Номер счёта — ${invoice.id}.`,
            interaction:
              invoice.paymentUrl && /^https?:\/\//i.test(invoice.paymentUrl)
                ? {
                    inline_keyboard: [
                      [{ text: "Оплатить счёт", url: invoice.paymentUrl }],
                    ],
                  }
                : undefined,
          });
        }
      }
    });
  }

  private async owner(customerId: string, orderId: string) {
    await this.subject.ecommerceModuleOrderAssertAccess({
      subjectId: customerId,
      orderId,
    });
  }

  private legacyDraftPdf(file: IOrderWorkFile) {
    return (
      file.operationKey?.startsWith("work-result:") &&
      file.originalFileId !== file.previewFileId &&
      file.previewMimeType === "application/pdf" &&
      file.originalMimeType === "application/pdf"
    );
  }

  private async hasLegacyFullTextDraft(work: IOrderWork) {
    if (
      work.paymentMode ||
      work.kind !== "individual-service" ||
      work.state === "canceled" ||
      !work.files.some((file) => this.legacyDraftPdf(file))
    ) {
      return false;
    }
    const { crm, ecommerce } = this.subject.modules;
    const task = await crm.task.findById({ id: work.taskId });
    if (
      !task?.productId ||
      !task.offerId ||
      task.orderId !== work.orderId ||
      task.customerId !== work.customerId ||
      task.storeId !== work.storeId
    ) {
      return false;
    }
    const [offer, lines] = await Promise.all([
      ecommerce.storesToProducts.findById({ id: task.offerId }),
      ecommerce.ordersToProducts.find({
        params: {
          limit: 2,
          filters: {
            and: [
              { column: "orderId", method: "eq", value: work.orderId },
              { column: "parentLineId", method: "isNull", value: null },
            ],
          },
        },
      }),
    ]);
    const [line] = lines;
    return (
      offer?.storeId === work.storeId &&
      offer.productId === task.productId &&
      offer.settings?.closedForNewOrders === true &&
      offer.settings.fullTextDraftPreview === true &&
      lines.length === 1 &&
      line.orderId === work.orderId &&
      line.productId === offer.productId &&
      line.offerId === offer.id
    );
  }

  private async describe(
    customerId: string,
    work: IOrderWork,
  ): Promise<IOrderWorkView> {
    const descriptor = (id: string): IOrderArtifact => ({
      id,
      path: orderArtifactPath(customerId, work.orderId, id),
    });
    const delivered = Boolean(
      (work.paid && work.deliveredAt) || deliveredOrderWorkFile(work),
    );
    const result = orderResultFiles(work, descriptor);
    const legacyBrief = await this.hasLegacyFullTextDraft(work);
    if (legacyBrief) {
      const draftIds = new Set(
        work.files
          .filter((file) => this.legacyDraftPdf(file))
          .map((file) => file.previewFileId),
      );
      result.files = result.files.map((file) =>
        draftIds.has(file.id)
          ? { ...file, name: "brief-draft.txt", previewMimeType: "text/plain" }
          : file,
      );
    }
    return {
      orderId: work.orderId,
      taskId: work.taskId,
      storeId: work.storeId,
      state: work.state,
      ...result,
      receipt:
        work.paid && work.receiptFileId ? descriptor(work.receiptFileId) : null,
      deliveryStatus: delivered ? "available" : "pending",
      trackingNumber:
        work.fulfillment.find((event) => event.stage === "in-transit")
          ?.trackingNumber ?? null,
      expertArchive:
        delivered && work.expertArchive?.length
          ? work.expertArchive
          : undefined,
    };
  }

  async read(customerId: string, input: IPurchase) {
    await this.owner(customerId, input.orderId);
    const work = await this.work.read(this.scope(customerId, input));
    return this.describe(customerId, work);
  }

  async assertPaymentStage(customerId: string, orderId: string) {
    const work = await this.work.findByOrder(orderId);
    if (work?.paymentMode === "work-tokens") {
      throw new Error(
        "Conflict error. This order is covered by token charges for work",
      );
    }
    if (!work || work.paid) {
      return;
    }
    const tasks = this.subject.modules.crm.task;
    const funnel = await tasks.getFunnel(work);
    const stages = funnel.definition.stages;
    if (
      !stages.some(
        (stage) =>
          !stage.archived &&
          stage.behavior === "ecommerce-module-order-payment",
      )
    ) {
      return;
    }
    const task = await tasks.get(work);
    const stage = stages.find((entry) => entry.id === task.stageId);
    if (
      task.customerId !== customerId ||
      task.orderId !== orderId ||
      task.status === "closed" ||
      !stage ||
      !isOrderPaymentStage(stage)
    ) {
      throw new Error("Conflict error. The order is not at its payment stage");
    }
  }

  preparePdfResult = pdfOrderResult;
  prepareImageResult = imageOrderResult;

  async publishResultFromRun(input: IProduceOrderResult) {
    const { storeId, taskId, assigneeId, assignmentRevision, attemptId } =
      input;
    const tasks = this.subject.modules.crm.task;
    return tasks.withWork(
      {
        storeId,
        taskId,
        assigneeId,
        expectedAssignmentRevision: assignmentRevision,
      },
      async ({ task, stage }) => {
        if (task.assigneeKind !== "ai" || !task.orderId) {
          throw new Error("Conflict error. The assigned run has no work order");
        }
        const ecommerce = this.subject.modules.ecommerce;
        const scope = {
          storeId,
          taskId,
          orderId: task.orderId,
          customerId: task.customerId,
        };
        await this.owner(scope.customerId, scope.orderId);
        return this.work.withOrderLock(scope.orderId, async () => {
          const operationKey = `work-result:${attemptId}`;
          const existing = await this.work.read(scope);
          const previous = existing.files.find(
            (version) => version.operationKey === operationKey,
          );
          const artifact = {
            ...scope,
            operationKey,
            actorId: assigneeId,
            original: input.original,
            preview: input.preview,
          };
          if (previous) {
            return this.work.publishResult({
              ...artifact,
              price: previous.price,
              currencyId: previous.currencyId,
              priceBasis: previous.priceBasis,
              purchaseQuote: previous.purchaseQuote,
            });
          }
          const cart = await ecommerce.order.findByIdCartDetails({
            id: scope.orderId,
          });
          const currencyId = cart.billingModuleCurrencyId;
          if (!currencyId) {
            throw new Error(
              "Conflict error. Choose a currency for this work order",
            );
          }
          const quotedAt = new Date().toISOString();
          const stageBasis = {
            publicationId: task.publicationId,
            stageId: stage.id,
            quotedAt,
          };
          let price: string;
          let purchaseQuote: IOrderWorkPurchaseQuote | undefined;
          let priceBasis: TOrderWorkPriceBasis = {
            ...stageBasis,
            kind: "cart-price",
          };
          const primary = cart.lines.filter((item) => !item.parentLineId);
          if (primary.length !== 1 || primary[0].offerId !== task.offerId) {
            throw new Error(
              "Conflict error. Work order does not match the task's offer",
            );
          }
          const [line] = primary;
          if (line.offerId) {
            const quote = await ecommerce.storesToProducts.quote({
              offerId: line.offerId,
              quantity: line.quantity,
              currencyId,
              lineId: line.id,
              destination: line.destination,
              services: cart.lines.flatMap((item) =>
                item.parentLineId === line.id && item.offerId
                  ? [
                      {
                        offerId: item.offerId,
                        quantity: item.quantity,
                        lineId: item.id,
                      },
                    ]
                  : [],
              ),
            });
            if (!quote || quote.amount === null || quote.issues.length) {
              throw new Error(
                "Conflict error. No current price applies to this work order",
              );
            }
            price = quote.amount;
            purchaseQuote = {
              version: quote.version,
              destination: quote.destination ?? line.destination,
              charges: quote.charges,
              lines: cart.lines.flatMap((item) =>
                item.offerId
                  ? [
                      {
                        id: item.id,
                        offerId: item.offerId,
                        quantity: item.quantity,
                        parentLineId: item.parentLineId ?? null,
                      },
                    ]
                  : [],
              ),
            };
            if (purchaseQuote.lines.length !== cart.lines.length) {
              throw new Error(
                "Conflict error. Select all offers before publishing the result price",
              );
            }
            priceBasis = {
              ...stageBasis,
              kind: "offer",
              quoteVersion: quote.version,
            };
          } else {
            const total = cart.totals.find(
              (value) => value.billingModuleCurrency.id === currencyId,
            );
            if (!total || cart.unpriced?.length) {
              throw new Error(
                "Conflict error. No current price applies to this work order",
              );
            }
            price = total.total.toFixed(8);
          }

          const tariff = stage.resultPricing;
          if (existing.paymentMode === "work-tokens") {
            if (tariff?.kind !== "work-tokens" || Number(price) !== 0) {
              throw new Error(
                "Conflict error. A token-funded result requires token-funded work and no checkout charge",
              );
            }
            priceBasis = { ...stageBasis, kind: "work-tokens" };
          }
          if (tariff?.kind === "confirmed-cost") {
            const currency =
              await this.subject.modules.billing.currency.findById({
                id: currencyId,
              });
            if (!currency) {
              throw new Error(
                "Not Found error. Result sale currency is unavailable",
              );
            }
            const reservations =
              await this.subject.modules.billing.transaction.find({
                params: {
                  filters: {
                    and: [
                      { column: "storeId", method: "eq", value: storeId },
                      { column: "taskId", method: "eq", value: taskId },
                      { column: "kind", method: "eq", value: "reserve" },
                      { column: "state", method: "eq", value: "settled" },
                      { column: "purpose", method: "eq", value: "agent-work" },
                    ],
                  },
                  orderBy: { and: [{ column: "id", method: "asc" }] },
                },
              });
            const precision = currencyPrecision(currency);
            const result = calculateConfirmedResultPrice({
              reservations,
              tariff,
              currencyId,
              precision,
              quotedAt,
            });
            price = result.price;
            priceBasis = {
              ...stageBasis,
              kind: "confirmed-cost",
              multiplier: tariff.multiplier,
              precision,
              rounding: "half-up",
              costs: result.costs,
            };
            if (purchaseQuote) {
              purchaseQuote = priceResultCharges(
                purchaseQuote,
                price,
                task.publicationId,
              );
            }
          }

          return this.work.publishResult({
            ...artifact,
            price,
            currencyId,
            priceBasis,
            purchaseQuote,
          });
        });
      },
    );
  }

  async decision(
    customerId: string,
    orderId: string,
    command: TOrderWorkDecision,
  ) {
    if (
      !(await this.subject.authenticationMe({ subjectId: customerId }))
        ?.authenticated
    ) {
      throw new Error("Authentication error. Sign in to decide on the result");
    }
    return this.subject.repository.withSubjectLock(
      { subjectId: customerId },
      async () => {
        await this.owner(customerId, orderId);
        const scope = this.scope(customerId, { ...command, orderId });
        const work = await this.work.read(scope);
        const file = work.files.find(
          (entry) => entry.previewFileId === command.fileId,
        );
        if (!file) {
          throw new Error(
            "Not Found error. The file does not belong to this order",
          );
        }

        const replay = work.decisions.some(
          (entry) => entry.operationKey === command.operationKey,
        );
        if (!replay) {
          this.work.assertCurrentFile(work, file);
        }

        const request = {
          ...scope,
          fileId: file.id,
          operationKey: command.operationKey,
        };
        if (command.operation === "decline") {
          if (!replay) {
            await this.subject.customerWork.execute(customerId, {
              operation: "message",
              storeId: scope.storeId,
              taskId: scope.taskId,
              operationKey: orderFileFeedbackOperationKey(
                file.id,
                command.operationKey,
              ),
              text: command.reason,
            });
          }
          const revised = await this.work.decline({
            ...request,
            reason: command.reason,
          });
          return this.describe(customerId, revised);
        }

        if (
          !work.decisions.some(
            (entry) => entry.operationKey === request.operationKey,
          )
        ) {
          await this.work.assertResultQuantitySnapshot(orderId, file);
          const crm = this.subject.modules.crm;
          const task = await crm.task.get(scope);
          if (
            task.customerId !== customerId ||
            task.orderId !== orderId ||
            task.status === "closed"
          ) {
            throw new Error(
              "Permission error. Result task does not belong to the purchase",
            );
          }
          const funnel = await crm.task.getFunnel(scope);
          const stage = funnel.definition.stages.find(
            (entry) => entry.id === task.stageId,
          );
          const acceptance =
            stage?.actions.filter(
              (entry) =>
                entry.actors.includes("system") &&
                entry.evidence.includes("result-accepted"),
            ) ?? [];
          if (
            acceptance.length === 0 &&
            work.decisions.some((entry) => entry.kind === "accepted")
          ) {
            const revised = await this.work.accept(request);
            return this.describe(customerId, revised);
          }
          if (acceptance.length !== 1) {
            throw new Error(
              "Conflict error. The current stage needs one result acceptance action",
            );
          }
          if (
            work.paymentMode === "work-tokens" &&
            (stage?.resultPricing?.kind !== "work-tokens" ||
              acceptance[0].outcome !== "completed")
          ) {
            throw new Error(
              "Conflict error. Accepting a token-funded result must complete the task",
            );
          }
          const moved = await crm.task.transition({
            ...scope,
            actorId: customerId,
            actorKind: "system",
            expectedRevision: task.revision,
            operationKey: `result-accepted:${command.operationKey}`,
            actionId: acceptance[0].id,
            evidence: {
              kind: "result-accepted",
              orderId,
              fileId: file.id,
            },
          });
          const next = funnel.definition.stages.find(
            (entry) => entry.id === moved.stageId,
          );
          const revised = await this.work.accept(request);
          if (revised.paymentMode === "work-tokens") {
            return this.deliverIncludedResult(request, moved);
          }
          if (moved.status !== "closed" && next) {
            const assigned =
              await this.subject.customerWork.assignStageEmployee(moved, next);
            await this.subject.customerWork.queueStageEntry(assigned);
          }
          return this.describe(customerId, revised);
        }
        const revised = await this.work.accept(request);
        if (revised.paymentMode === "work-tokens") {
          const task = await this.subject.modules.crm.task.get(scope);
          return this.deliverIncludedResult(request, task);
        }
        return this.describe(customerId, revised);
      },
    );
  }

  private async deliverIncludedResult(
    request: IInternalScope & { fileId: string },
    task: ITask,
  ) {
    const delivered = await this.work.releaseIncludedFile(
      request,
      (scope, ids) => this.grantFiles(scope, ids),
    );
    if (delivered.resultFileId) {
      await this.subject.customerWork.postOrderNotice(task, {
        key: `order-result:${delivered.resultFileId}`,
        source: "order-result",
        text: "Бриф принят. Оригинал доступен для скачивания.",
        documentId: delivered.resultFileId,
      });
    }
    return this.describe(request.customerId, delivered);
  }

  accept(
    customerId: string,
    input: IPurchase & { fileId: string; operationKey: string },
  ) {
    const { orderId, ...command } = input;
    return this.decision(customerId, orderId, {
      ...command,
      operation: "accept",
    });
  }

  decline(
    customerId: string,
    input: IPurchase & {
      fileId: string;
      operationKey: string;
      reason: string;
    },
  ) {
    const { orderId, ...command } = input;
    return this.decision(customerId, orderId, {
      ...command,
      operation: "decline",
    });
  }

  private async grantFiles(
    payment: { customerId: string; orderId: string },
    fileIds: string[],
  ) {
    await this.owner(payment.customerId, payment.orderId);
    const { role, subjectsToRoles } = this.subject.module;
    const { permission } = role.module;
    const slug = `order-work-artifact-${payment.orderId}`;
    const grant = await role.findOrCreate({
      data: { slug, title: slug, availableOnRegistration: false },
    });
    for (const fileId of fileIds) {
      const paths = [
        orderArtifactPath(payment.customerId, payment.orderId, fileId),
        protectedFileContentPath(payment.customerId, fileId),
      ];
      for (const path of paths) {
        for (const method of ["GET", "HEAD"]) {
          const capability = await permission.findOrCreate({
            data: { type: "HTTP", method, path },
          });
          await role.module.rolesToPermissions.findOrCreate({
            data: {
              roleId: grant.entity.id,
              permissionId: capability.entity.id,
            },
          });
        }
      }
    }
    await subjectsToRoles.findOrCreate({
      data: { subjectId: payment.customerId, roleId: grant.entity.id },
    });
  }

  private async receipt(payment: IOrderWorkPayment) {
    const currency = await this.subject.modules.billing.currency.findById({
      id: payment.currencyId,
    });
    if (!currency) {
      throw new Error("Conflict error. The paid order currency does not exist");
    }
    const document = new jsPDF();
    document.text(
      [
        "Payment receipt",
        `Order ${payment.orderId}`,
        `Invoice ${payment.invoiceId}`,
        `Paid ${payment.paidAt}`,
        `Amount ${payment.price} ${currency.slug.toUpperCase()}`,
      ],
      14,
      24,
    );
    return {
      name: `receipt-${payment.orderId}.pdf`,
      mimeType: "application/pdf",
      bytes: new Uint8Array(document.output("arraybuffer")),
    };
  }

  async consumePayment(input: { orderId: string; eventId: string }) {
    const record = await this.work.findByOrder(input.orderId);
    if (!record) {
      throw new Error("Not Found error. Order payment event does not exist");
    }
    const tasks = this.subject.modules.crm.task;
    let queuedReply = false;
    const result = await tasks.withTask(record, async (task) => {
      const work = await this.work.read(record);
      const payment = work.paid;
      if (!payment || payment.id !== input.eventId) {
        throw new Error("Not Found error. Order payment event does not exist");
      }
      if (
        task.orderId !== work.orderId ||
        task.customerId !== work.customerId
      ) {
        throw new Error("Conflict error. Payment does not match its task");
      }
      const funnel = await tasks.getFunnel(work);
      const stages = funnel.definition.stages;
      const conversation = this.subject.customerWork;
      const messageId = await conversation.postOrderPayment(task, payment);
      const moved = await this.recordPayment(work, task, stages, payment);
      const target = moved ?? (!work.receiptFileId ? task : undefined);
      const next =
        target && stages.find((stage) => stage.id === target.stageId);
      if (target && target.status !== "closed" && next) {
        queuedReply = Boolean(
          await conversation.enterPaidOrderStage(
            target,
            next,
            messageId,
            payment,
          ),
        );
      }
      const recorded = await this.work.issueReceipt(
        { ...work, eventId: payment.id },
        (snapshot, ids) => this.grantFiles(snapshot, ids),
        (snapshot) => this.receipt(snapshot),
      );
      if (recorded.receiptFileId) {
        await conversation.postOrderNotice(task, {
          key: `order-receipt:${payment.id}`,
          text: "Чек об оплате заказа.",
          source: "order-receipt",
          documentId: recorded.receiptFileId,
        });
      }
      return this.describe(recorded.customerId, recorded);
    });
    if (queuedReply) {
      this.subject.customerWork.wakePendingWork(record.taskId);
    }
    return result;
  }

  async releaseAgentFile(
    task: ITask,
    selection: { paymentId: string; fileId: string },
  ) {
    if (
      !task.orderId ||
      task.assigneeKind !== "ai" ||
      !task.assigneeId ||
      task.status !== "active"
    ) {
      throw new Error(
        "Conflict error. This assignment cannot deliver an order file",
      );
    }
    return this.work.releasePaidFile(
      {
        storeId: task.storeId,
        taskId: task.id,
        customerId: task.customerId,
        orderId: task.orderId,
        eventId: selection.paymentId,
        fileId: selection.fileId,
      },
      (payment, ids) => this.grantFiles(payment, ids),
    );
  }

  async finishAgentFileStage(
    task: ITask,
    stage: IFunnelStage,
    fileId: string,
    selection: { paymentId: string; fileId: string },
  ) {
    if (!task.orderId || !task.assigneeId) {
      throw new Error("Conflict error. No assigned work order");
    }
    const work = await this.work.findByOrder(task.orderId);
    if (
      !work?.paid ||
      work.paid.id !== selection.paymentId ||
      !work.deliveredAt ||
      work.resultFileId !== fileId
    ) {
      throw new Error("Conflict error. The order file has not been delivered");
    }
    const payment = work.paid;
    const paymentAction = stage.actions.find(
      (action) =>
        action.outcome === "completed" &&
        action.actors.includes("system") &&
        action.evidence.includes("payment"),
    );
    if (paymentAction) {
      return this.recordPayment(work, task, [stage], payment);
    }
    if (stage.behavior !== "order-file-delivery") {
      return undefined;
    }
    const action = stage.actions.find(
      (entry) =>
        entry.actors.includes("system") &&
        (entry.evidence.includes("delivery") ||
          entry.evidence.includes("file-access")),
    );
    if (!action) {
      return undefined;
    }
    const evidence = action.evidence.includes("delivery")
      ? {
          kind: "delivery" as const,
          orderId: task.orderId,
          deliveryId: fileId,
          stage: "delivered" as const,
        }
      : {
          kind: "file-access" as const,
          orderId: task.orderId,
          grantId: fileId,
        };
    return this.subject.modules.crm.task.transition({
      storeId: task.storeId,
      taskId: task.id,
      expectedRevision: task.revision,
      actorId: task.assigneeId,
      actorKind: "system",
      causeId: payment.id,
      operationKey: `order-file-delivery:${payment.id}`,
      actionId: action.id,
      evidence,
    });
  }

  async publishedReceipts(customerId: string, orderId: string) {
    const owners = await this.receiptOwner(orderId);
    if (owners !== customerId) {
      return [];
    }
    const links = await this.receiptLinks(orderId);
    const ids = links.flatMap((link) =>
      link.privateReceiptFileId &&
      (!link.legacyReceiptLocation || link.legacyReceiptRevokedAt)
        ? [link.privateReceiptFileId]
        : [],
    );
    if (ids.length) {
      await this.subject.modules.ecommerce.order.repository.withLifecycleLock(
        orderId,
        async () => {
          if ((await this.receiptOwner(orderId)) === customerId) {
            await this.grantFiles({ customerId, orderId }, ids);
          }
        },
      );
    }
    return ids.map((id) => ({
      id,
      path: orderArtifactPath(customerId, orderId, id),
    }));
  }

  private async receiptOwner(orderId: string) {
    const links =
      await this.subject.module.subjectsToEcommerceModuleOrders.find({
        params: {
          filters: {
            and: [
              {
                column: "ecommerceModuleOrderId",
                method: "eq",
                value: orderId,
              },
            ],
          },
        },
      });
    const owners = new Set(links.map(({ subjectId }) => subjectId));
    const [owner] = owners;
    if (owners.size === 1 && owner) {
      return owner;
    }
    return null;
  }

  private receiptLinks(orderId: string) {
    return this.subject.modules.ecommerce.ordersToFileStorageModuleFiles.find({
      params: {
        filters: {
          and: [
            { column: "orderId", method: "eq", value: orderId },
            { column: "variant", method: "eq", value: "receipt-default" },
          ],
        },
      },
    });
  }

  private async recordPayment(
    work: IOrderWork,
    task: ITask,
    stages: IFunnelStage[],
    payment: IOrderWorkPayment,
  ) {
    if (task.status === "closed") {
      return;
    }
    const stage = stages.find((entry) => entry.id === task.stageId);
    const action = stage?.actions.find(
      (entry) =>
        entry.actors.includes("system") && entry.evidence.includes("payment"),
    );
    if (!action) {
      return;
    }

    if (
      action.outcome === "completed" &&
      payment.fileId &&
      !work.resultFileId
    ) {
      return task;
    }
    const key = `order-payment:${payment.id}`;
    const prior = await this.subject.modules.crm.tasksToStages.byOperation(
      task.id,
      key,
    );
    if (prior) {
      return;
    }
    return this.subject.modules.crm.task.transition({
      storeId: work.storeId,
      taskId: work.taskId,
      expectedRevision: task.revision,
      actorId: work.customerId,
      actorKind: "system",
      causeId: payment.id,
      operationKey: key,
      actionId: action.id,
      evidence: {
        kind: "payment",
        orderId: work.orderId,
        paymentId: payment.paymentIntentId,
      },
    });
  }

  async artifact(
    customerId: string,
    orderId: string,
    fileId: string,
    method: "GET" | "HEAD",
    storeId?: string,
  ) {
    if (storeId) {
      return this.subject.crmWorkspace.storeOrderArtifact(
        customerId,
        storeId,
        orderId,
        fileId,
      );
    }
    await this.owner(customerId, orderId);
    const work = await this.work.findByOrder(orderId);
    const owned =
      work?.customerId === customerId && work.orderId === orderId ? work : null;
    const preview = owned?.files.find((file) => file.previewFileId === fileId);
    if (
      owned &&
      preview &&
      this.legacyDraftPdf(preview) &&
      (await this.hasLegacyFullTextDraft(owned))
    ) {
      const draft = await this.legacyDraftText(preview);
      return {
        id: preview.previewFileId,
        name: "brief-draft.txt",
        mimeType: "text/plain",
        bytes: draft,
        size: draft.length,
      };
    }
    if (!preview) {
      const isDelivered =
        (owned?.paid && owned.receiptFileId === fileId) ||
        deliveredOrderWorkFile(owned)?.originalFileId === fileId;
      const isReceipt =
        !isDelivered &&
        (await this.receiptOwner(orderId)) === customerId &&
        (await this.receiptLinks(orderId)).some(
          (link) =>
            link.privateReceiptFileId === fileId &&
            (!link.legacyReceiptLocation || link.legacyReceiptRevokedAt),
        );
      if (
        (!isDelivered && !isReceipt) ||
        !(await this.subject.protectedFile.hasGrant(
          customerId,
          orderArtifactPath(customerId, orderId, fileId),
          method,
        ))
      ) {
        throw new Error("Not Found error. Order artifact does not exist");
      }
    }

    const file =
      await this.subject.modules.fileStorage.file.privateContent.findById({
        id: fileId,
      });
    if (!file) {
      throw new Error("Not Found error. Order artifact does not exist");
    }
    return file;
  }

  async readFullTextDraft(work: IOrderWork, fileId: string) {
    const file = work.files.find(({ id }) => id === fileId);
    if (!file || file.invalidatedByCartEdit) {
      return undefined;
    }
    if (
      work.paymentMode === "work-tokens" &&
      file.previewMimeType === "text/plain"
    ) {
      const preview =
        await this.subject.modules.fileStorage.file.privateContent.findById({
          id: file.previewFileId,
          mimeType: "text/plain",
          maxBytes: FILE_PREVIEW_TEXT_MAX_BYTES,
        });
      if (!preview) {
        throw new Error(
          "Conflict error. The previous brief draft is unavailable",
        );
      }
      return preview.bytes;
    }
    if (
      this.legacyDraftPdf(file) &&
      (await this.hasLegacyFullTextDraft(work))
    ) {
      return this.legacyDraftText(file);
    }
    return undefined;
  }

  private async legacyDraftText(file: IOrderWorkFile) {
    const source =
      await this.subject.modules.fileStorage.file.privateContent.findById({
        id: file.originalFileId,
        mimeType: "application/pdf",
        maxBytes: FILE_PREVIEW_TEXT_MAX_BYTES,
      });
    if (!source) {
      throw new Error("Not Found error. The brief draft is unavailable");
    }
    const text = await readOrderPdfText(source.bytes);
    const bytes = Buffer.from(text);
    if (!bytes.length || bytes.length > FILE_PREVIEW_TEXT_MAX_BYTES) {
      throw new Error("Conflict error. The brief draft is unavailable");
    }
    return bytes;
  }

  private deliveredVersion(customerId: string, work: IOrderWork | undefined) {
    if (
      work?.customerId !== customerId ||
      work.kind !== "individual-service" ||
      !work.deliveredAt ||
      !work.resultFileId ||
      work.receiptFileId === work.resultFileId ||
      work.files.some(
        ({ previewFileId }) => previewFileId === work.resultFileId,
      )
    ) {
      return undefined;
    }
    return deliveredOrderWorkFile(work);
  }

  async profileKnowledgeResult(customerId: string, work: IOrderWork) {
    const version = this.deliveredVersion(customerId, work);
    if (
      !version?.originalName ||
      !isSupportedAiChatAttachment({
        name: version.originalName,
        type: version.originalMimeType,
      }) ||
      !(await this.subject.protectedFile.hasGrant(
        customerId,
        orderArtifactPath(customerId, work.orderId, version.originalFileId),
        "GET",
      ))
    ) {
      return undefined;
    }
    const personal = new PersonalSources(this.subject);
    const profileId = await personal.profileForOwner(customerId);
    if (!profileId) {
      return undefined;
    }
    const source = await personal.orderArtifact(profileId, {
      orderId: work.orderId,
      versionId: version.id,
    });
    return {
      id: version.originalFileId,
      versionId: version.id,
      name: version.originalName,
      mimeType: version.originalMimeType,
      savedToKnowledge: Boolean(source),
    };
  }

  async setArtifactKnowledge(
    customerId: string,
    orderId: string,
    artifactId: string,
    method: "POST" | "DELETE",
  ): Promise<IOrderArtifactKnowledge> {
    return this.subject.repository.withSubjectLock(
      { subjectId: customerId, savepoint: true },
      async () => {
        await this.owner(customerId, orderId);
        const work = await this.work.findByOrder(orderId);
        const version = this.deliveredVersion(customerId, work);
        if (
          work?.orderId !== orderId ||
          version?.originalFileId !== artifactId
        ) {
          throw new Error(
            "Not Found error. Delivered order result is unavailable",
          );
        }
        const personal = new PersonalSources(this.subject);
        const profileId = await personal.profileForOwner(customerId);
        if (!profileId) {
          throw new Error(
            "Not Found error. The personal profile is unavailable",
          );
        }
        const origin = { orderId, versionId: version.id };
        if (method === "DELETE") {
          await personal.removeOrderArtifact(customerId, profileId, origin);
          return { profileId, sourceId: null };
        }
        const file = await this.artifact(
          customerId,
          orderId,
          artifactId,
          "GET",
        );
        if (
          !isSupportedAiChatAttachment({ name: file.name, type: file.mimeType })
        ) {
          throw new Error(
            "Validation error. This result format cannot be indexed",
          );
        }
        const sourceId = await personal.saveOrderArtifact(
          customerId,
          profileId,
          origin,
          new File([Uint8Array.from(file.bytes)], file.name, {
            type: file.mimeType,
          }),
        );
        return { profileId, sourceId };
      },
    );
  }

  async fulfill(
    actorId: string,
    input: Omit<IOrderPhysicalEvidence, "actorId" | "customerId">,
  ) {
    const tasks = this.subject.modules.crm.task;
    return tasks.withTask(input, async (task) => {
      await this.subject.crmWorkspace.assertFulfillmentStaff(
        actorId,
        task.storeId,
      );
      if (
        task.orderId !== input.orderId ||
        task.assigneeId !== actorId ||
        task.assigneeKind !== "human"
      ) {
        throw new Error(
          "Permission error. Only the assigned store employee can record fulfillment",
        );
      }
      const work = await this.work.findByOrder(input.orderId);
      const repeated = work?.fulfillment.some(
        (event) => event.operationKey === input.operationKey,
      );
      if (task.status === "closed" && !repeated) {
        throw new Error("Conflict error. The fulfillment task is closed");
      }
      const funnel = await tasks.getFunnel(input);
      const stage = funnel.definition.stages.find(
        (entry) => entry.id === task.stageId,
      );
      const hasMilestones = funnel.definition.stages.some((entry) =>
        entry.actions.some((action) => action.deliveryStage === input.stage),
      );
      const actions =
        stage?.actions.filter(
          (entry) =>
            entry.actors.includes("system") &&
            entry.evidence.includes("delivery") &&
            (entry.deliveryStage ?? "delivered") === input.stage,
        ) ?? [];
      if (
        actions.length > 1 ||
        (hasMilestones && !actions.length && !repeated)
      ) {
        throw new Error(
          "Conflict error. The current step does not allow this fulfillment milestone",
        );
      }
      const [action] = actions;
      const event = await this.work.fulfill({
        ...input,
        actorId,
        customerId: task.customerId,
      });
      if (action && task.status !== "closed") {
        const key = `order-delivery:${event.id}`;
        const prior = await this.subject.modules.crm.tasksToStages.byOperation(
          task.id,
          key,
        );
        if (!prior) {
          await tasks.transition({
            ...input,
            actorId,
            actorKind: "system",
            expectedRevision: task.revision,
            operationKey: key,
            actionId: action.id,
            causeId: event.id,
            evidence: {
              kind: "delivery",
              orderId: input.orderId,
              deliveryId: event.id,
              stage: event.stage,
            },
          });
        }
      }
      return event;
    });
  }
}
