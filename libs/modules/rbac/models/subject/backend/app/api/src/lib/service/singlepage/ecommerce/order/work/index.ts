import { jsPDF } from "jspdf";
import { currencyPrecision } from "@sps/billing/models/currency/sdk/model";
import type {
  IModel as IOrderWork,
  IOrderWorkArtifact,
  IOrderWorkPayment,
  IOrderWorkPurchaseQuote,
  TOrderWorkPriceBasis,
  IOrderWorkScope as IInternalScope,
  IOrderPhysicalEvidence,
} from "@sps/ecommerce/models/order-work/sdk/model";
import {
  orderArtifactPath,
  type IOrderArtifact,
  type IOrderWorkScope,
  type IOrderWorkView,
  type TOrderWorkDecision,
} from "@sps/rbac/models/subject/sdk/model/src/lib/order-work";
import type { Service as Subject } from "../../../index";
import {
  calculateConfirmedResultPrice,
  imageOrderResult,
  pdfOrderResult,
  priceResultCharges,
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

  private async owner(customerId: string, orderId: string) {
    await this.subject.ecommerceModuleOrderAssertAccess({
      subjectId: customerId,
      orderId,
    });
  }

  private describe(customerId: string, work: IOrderWork): IOrderWorkView {
    const descriptor = (id: string): IOrderArtifact => ({
      id,
      path: orderArtifactPath(customerId, work.orderId, id),
    });
    return {
      orderId: work.orderId,
      taskId: work.taskId,
      storeId: work.storeId,
      state: work.state,
      versions: work.versions.map((version) => ({
        id: version.id,
        number: version.number,
        createdAt: version.createdAt,
        price: version.price,
        currencyId: version.currencyId,
        preview: descriptor(version.previewFileId),
      })),
      acceptedVersionId: work.acceptedVersionId,
      paidVersionId: work.paid?.resultVersionId ?? null,
      result: work.resultFileId ? descriptor(work.resultFileId) : null,
      receipt: work.receiptFileId ? descriptor(work.receiptFileId) : null,
      deliveryStatus: work.deliveredAt ? "available" : "pending",
      trackingNumber:
        work.fulfillment.find((event) => event.stage === "in-transit")
          ?.trackingNumber ?? null,
    };
  }

  async read(customerId: string, input: IPurchase) {
    await this.owner(customerId, input.orderId);
    const work = await this.work.read(this.scope(customerId, input));
    return this.describe(customerId, work);
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
          const previous = existing.versions.find(
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
              await this.subject.module.subjectsToWalletOperations.find({
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
        const version = work.versions.find(
          (entry) => entry.id === command.resultVersionId,
        );
        if (!version) {
          throw new Error(
            "Not Found error. Result version does not belong to this order",
          );
        }

        const request = {
          ...scope,
          resultVersionId: version.id,
          operationKey: command.operationKey,
        };
        if (command.operation === "decline") {
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
          const publication = await crm.task.getPublication(scope);
          const stage = publication.definition.stages.find(
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
          await crm.task.transition({
            ...scope,
            actorId: customerId,
            actorKind: "system",
            expectedRevision: task.revision,
            operationKey: `result-accepted:${command.operationKey}`,
            actionId: acceptance[0].id,
            evidence: {
              kind: "result-accepted",
              orderId,
              resultVersionId: version.id,
            },
          });
        }
        const revised = await this.work.accept(request);
        return this.describe(customerId, revised);
      },
    );
  }

  accept(
    customerId: string,
    input: IPurchase & { resultVersionId: string; operationKey: string },
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
      resultVersionId: string;
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
      const path = orderArtifactPath(
        payment.customerId,
        payment.orderId,
        fileId,
      );
      for (const method of ["GET", "HEAD"]) {
        const capability = await permission.findOrCreate({
          data: { type: "HTTP", method, path },
        });
        await role.module.rolesToPermissions.findOrCreate({
          data: { roleId: grant.entity.id, permissionId: capability.entity.id },
        });
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
    const work = await this.work.deliver(
      input,
      (snapshot, ids) => this.grantFiles(snapshot, ids),
      (snapshot) => this.receipt(snapshot),
    );
    await this.recordPayment(work);
    return this.describe(work.customerId, work);
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

  private async recordPayment(work: IOrderWork) {
    const payment = work.paid;
    if (!payment) {
      return;
    }
    const tasks = this.subject.modules.crm.task;
    const task = await tasks.get({
      storeId: work.storeId,
      taskId: work.taskId,
    });
    if (
      task.orderId !== work.orderId ||
      task.customerId !== work.customerId ||
      task.status === "closed"
    ) {
      return;
    }

    const publication = await tasks.getPublication({
      storeId: work.storeId,
      taskId: work.taskId,
    });
    const stage = publication.definition.stages.find(
      (entry) => entry.id === task.stageId,
    );
    const action = stage?.actions.find(
      (entry) =>
        entry.actors.includes("system") && entry.evidence.includes("payment"),
    );
    if (!action) {
      return;
    }

    const key = `order-payment:${payment.id}`;
    const prior = await this.subject.modules.crm.taskEvent.byOperation(
      task.id,
      key,
    );
    if (prior) {
      return;
    }
    await tasks.transition({
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

  private async hasFileGrant(
    customerId: string,
    orderId: string,
    fileId: string,
    method: string,
  ) {
    const path = orderArtifactPath(customerId, orderId, fileId);
    const permission = await this.subject.module.role.module.permission.find({
      params: {
        filters: {
          and: [
            { column: "type", method: "eq", value: "HTTP" },
            { column: "method", method: "eq", value: method },
            { column: "path", method: "eq", value: path },
          ],
        },
      },
    });
    if (!permission.length) {
      return false;
    }

    const [links, grants] = await Promise.all([
      this.subject.module.role.module.rolesToPermissions.find({
        params: {
          filters: {
            and: [
              {
                column: "permissionId",
                method: "inArray",
                value: permission.map((entry) => entry.id),
              },
            ],
          },
        },
      }),
      this.subject.module.subjectsToRoles.find({
        params: {
          filters: {
            and: [{ column: "subjectId", method: "eq", value: customerId }],
          },
        },
      }),
    ]);
    const roles = new Set(grants.map((entry) => entry.roleId));
    return links.some((entry) => roles.has(entry.roleId));
  }

  async artifact(
    customerId: string,
    orderId: string,
    fileId: string,
    method: "GET" | "HEAD",
  ) {
    await this.owner(customerId, orderId);
    const work = await this.work.findByOrder(orderId);
    const owned = work?.customerId === customerId ? work : null;
    const isPreview = owned?.versions.some(
      (version) => version.previewFileId === fileId,
    );
    if (!isPreview) {
      const isDelivered =
        owned?.deliveredAt &&
        [owned.receiptFileId, owned.resultFileId].includes(fileId);
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
        !(await this.hasFileGrant(customerId, orderId, fileId, method))
      ) {
        throw new Error("Not Found error. Order artifact does not exist");
      }
    }

    const file = await this.subject.modules.fileStorage.privateFile.findById({
      id: fileId,
    });
    if (!file) {
      throw new Error("Not Found error. Order artifact does not exist");
    }
    return file;
  }

  async fulfill(
    actorId: string,
    input: Omit<IOrderPhysicalEvidence, "actorId" | "customerId">,
  ) {
    const tasks = this.subject.modules.crm.task;
    return tasks.withTask(input, async (task) => {
      await this.subject.crmWorkspace.detail(actorId, {
        storeId: task.storeId,
        taskId: task.id,
      });
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
      const publication = await tasks.getPublication(input);
      const stage = publication.definition.stages.find(
        (entry) => entry.id === task.stageId,
      );
      const hasMilestones = publication.definition.stages.some((entry) =>
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
        const prior = await this.subject.modules.crm.taskEvent.byOperation(
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
