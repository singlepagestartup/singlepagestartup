import { logger } from "@sps/backend-utils";
import type { IModel as IWalletOperation } from "@sps/rbac/relations/subjects-to-wallet-operations/sdk/model";
import Decimal from "decimal.js";
import { inject, injectable } from "inversify";
import { z } from "zod";
import { CRUDService, DI } from "@sps/shared-backend-api";
import { createModules } from "@sps/agent/backend/app/api/src/lib/modules";
import type { IModel } from "@sps/agent/models/work-attempt/sdk/model";
import {
  estimateImageWork,
  estimateWork,
  estimateNestedWork,
  TRANSCRIPTION_USD_PER_MINUTE,
  supportsNestedWork,
  sendNestedWork,
  type TNestedWorkRequest,
  ProviderOutcomeUnknown,
  ProviderRejected,
  readWorkUsage,
  sendImageWork,
  sendWork,
  type ICompletedWork,
  type IImageWorkRequest,
  type IWorkRequest,
} from "@sps/shared-third-parties";
import { Repository } from "../../repository";
import { Maintenance } from "./maintenance";
import {
  Operations,
  embeddingIndexKey,
  makeNestedRequest,
  workStepDigest,
  type IWorkStep,
  type IWorkPlan,
} from "./operations";

const requestSchema = z
  .object({
    storeId: z.uuid(),
    taskId: z.uuid(),
    eventId: z.uuid(),
    assigneeId: z.uuid(),
    assignmentRevision: z.number().int().positive(),
    capability: z.enum(["text", "image"]),
  })
  .strict();
type IDispatch = z.infer<typeof requestSchema>;
interface IOutgoingWork {
  request: IWorkRequest | IImageWorkRequest | TNestedWorkRequest;
  secret: string;
  publicationId: string;
  imageActionId?: string;
}
const Money = Decimal.clone({ precision: 56 });
const reservationKey = (id: string) => `work:${id}`;
const now = () => new Date();

@injectable()
export class Service extends CRUDService<IModel> {
  declare repository: Repository;
  constructor(@inject(DI.IRepository) repository: Repository) {
    super(repository);
  }
  get modules() {
    return this.appAssembly.getOrCreate(createModules);
  }

  private async change(props: { id: string; data: Partial<IModel> }) {
    const updated = await this.update(props);
    if (!updated) throw new Error("Not found. Provider attempt");
    await this.projectExpense(updated);
    return updated;
  }

  private projectExpense(attempt: IModel) {
    const compute =
      attempt.result &&
      new Money(attempt.result.usage.usd).div(attempt.terms.usdPerSps);
    return this.modules.rbac.subject.workLedger.changeProviderWork(
      attempt.storeId,
      reservationKey(attempt.id),
      (previous) => ({
        resolution: previous?.resolution,
        checkedAt: previous?.checkedAt,
        uncoveredCostSps:
          compute && compute.gt(attempt.maximum)
            ? compute.minus(attempt.maximum).toDecimalPlaces(12).toFixed()
            : undefined,
        attemptId: attempt.id,
        stepKey: attempt.stepKey,
        eventId: attempt.eventId,
        publicationId: attempt.publicationId ?? undefined,
        executorId: attempt.executorId,
        connectionId: attempt.connectionId,
        provider: attempt.provider,
        externalAccount: attempt.externalAccount,
        model: attempt.model,
        state: attempt.state === "reserved" ? "dispatching" : attempt.state,
        providerRequestId: attempt.providerRequestId ?? undefined,
        ...attempt.result?.usage,
      }),
    );
  }

  private async previous(
    input: Omit<IDispatch, "capability"> & {
      capability: IModel["capability"];
      stepKey?: string;
    },
  ) {
    const rows = await this.find({
      params: {
        filters: {
          and: [
            { column: "storeId", method: "eq", value: input.storeId },
            { column: "taskId", method: "eq", value: input.taskId },
            { column: "eventId", method: "eq", value: input.eventId },
            { column: "capability", method: "eq", value: input.capability },
            {
              column: "stepKey",
              method: "eq",
              value: input.stepKey ?? "reply",
            },
          ],
        },
        limit: 1,
      },
    });
    if (
      rows[0] &&
      (rows[0].assigneeId !== input.assigneeId ||
        rows[0].assignmentRevision !== input.assignmentRevision)
    ) {
      throw new Error(
        "Conflict error. This event is bound to a different assignment",
      );
    }
    return rows[0];
  }

  private async prepare(
    input: IDispatch,
    step?: IWorkStep,
    plan?: IWorkPlan,
  ): Promise<{ attempt: IModel; outgoing?: IOutgoingWork }> {
    const { storeId, taskId, assigneeId, eventId, assignmentRevision } = input;
    const channel = step?.input.capability ?? "text";
    const stepKey = step?.operation ?? "reply";
    const requestDigest = step ? workStepDigest(step) : undefined;
    const key = [storeId, taskId, eventId].join(":");
    return this.repository.atomic(key, async () => {
      let prior = await this.previous({
        ...input,
        capability: channel,
        stepKey,
      });
      if (!prior && !step) {
        prior = await this.previous({ ...input, capability: "image" });
      }
      if (prior) {
        if (requestDigest && prior.requestDigest !== requestDigest) {
          throw new Error(
            "Conflict error. The same operation was prepared with a different input",
          );
        }
        return { attempt: prior };
      }
      const rbac = this.modules.rbac.subject;
      return this.modules.crm.task.withWork(
        {
          storeId,
          taskId,
          assigneeId,
          expectedAssignmentRevision: assignmentRevision,
        },
        async ({ task, stage, funding, maintenanceSourceId }) => {
          if (task.assigneeKind !== "ai" || !funding) {
            throw new Error("Permission error. No funded AI assignment");
          }

          if (
            plan?.publicationId &&
            plan.publicationId !== task.publicationId
          ) {
            throw new Error(
              "Conflict error. The workflow changed before the reply was prepared",
            );
          }
          const indexing =
            step?.input.capability === "embedding"
              ? step.input.indexing
              : undefined;
          if (
            (maintenanceSourceId || indexing) &&
            (!indexing ||
              indexing.sourceId !== maintenanceSourceId ||
              funding.payer !== "store-owner")
          ) {
            throw new Error(
              "Permission error. The task is reserved for maintenance of its configured source",
            );
          }
          if (
            step &&
            step.operation !== "knowledge-index" &&
            !stage.operations?.includes(step.operation)
          ) {
            throw new Error(
              "Permission error. This paid operation is unavailable in the published stage",
            );
          }
          const output = step ? "chat" : (stage.output ?? "chat");
          if (!step && input.capability === "image" && output !== "image") {
            throw new Error(
              "Permission error. The stage does not generate images",
            );
          }
          if (output !== "chat") {
            const order = task.orderId
              ? await this.modules.ecommerce.order.work.findByOrder(
                  task.orderId,
                )
              : null;
            if (
              order?.kind !== "individual-service" ||
              order.paid ||
              order.customerId !== task.customerId ||
              order.taskId !== taskId ||
              order.storeId !== storeId
            ) {
              throw new Error(
                "Conflict error. File generation requires an unpaid individual-service order",
              );
            }
          }

          const capability = output === "image" ? "image" : channel;
          const binding = await rbac.providerConnections.resolve(
            storeId,
            assigneeId,
            capability,
          );
          const terms =
            capability === "transcription"
              ? {
                  ...binding.terms,
                  audioUsdPerMinute:
                    binding.terms.audioUsdPerMinute ??
                    TRANSCRIPTION_USD_PER_MINUTE,
                }
              : binding.terms;
          if (
            indexing &&
            (binding.ownerId !== indexing.ownerId ||
              task.customerId !== indexing.ownerId)
          ) {
            throw new Error(
              "Permission error. The maintenance account belongs to another owner",
            );
          }
          if (step) {
            if (
              !supportsNestedWork(
                binding.provider,
                binding.model,
                step.input.capability,
              )
            ) {
              throw new Error(
                "Validation error. The provider model does not support the paid operation",
              );
            }
            if (step.input.capability === "embedding" && !indexing) {
              const key = embeddingIndexKey(
                binding.provider,
                binding.model,
                step.input.dimensions,
              );
              if (
                !(await this.modules.knowledge.source.hasEmbeddingIndex(
                  step.input.sourceIds,
                  key,
                ))
              ) {
                throw new Error(
                  "Conflict error. The embedding model has no matching scoped index",
                );
              }
            }
          }
          const context = indexing
            ? {
                sourceVersions: [
                  { id: indexing.sourceId, version: indexing.contentHash },
                ],
                messages: [],
                approvedMaximum: undefined,
              }
            : await rbac.customerWork.contextForRun({
                storeId,
                taskId,
                assigneeId,
                eventId,
                assignmentRevision,
              });
          if (plan?.sourceVersions?.length) {
            const liveVersions = new Map(
              context.sourceVersions.map(({ id, version }) => [id, version]),
            );
            if (
              plan.sourceVersions.some(
                ({ id, version }) => liveVersions.get(id) !== version,
              )
            ) {
              throw new Error(
                "Conflict error. A source used by this run is no longer available",
              );
            }
          }
          if (
            plan?.mediaDigest &&
            (!("media" in context) ||
              context.media?.digest !== plan.mediaDigest)
          ) {
            throw new Error(
              "Conflict error. The attachment used by this run changed",
            );
          }
          const payerId =
            funding.payer === "customer" ? task.customerId : binding.ownerId;
          const budget = new Money(funding.maxTaskAmount);
          if (
            funding.payer === "customer" &&
            (!context.approvedMaximum || budget.gt(context.approvedMaximum))
          ) {
            throw new Error(
              "Payment required. Customer approval is required for this maximum",
            );
          }

          const actions = stage.actions
            .filter(
              (action) =>
                action.actors.includes("ai") &&
                action.evidence.includes("model-result"),
            )
            .map((action) => ({
              id: action.id,
              instruction: action.instruction ?? action.name,
            }));
          const instructions = [
            stage.instruction,
            stage.evidenceInstruction,
            stage.missingDataInstruction,
          ];
          const cartOffers =
            !step && output === "chat" && "cartOffers" in context
              ? context.cartOffers
              : undefined;
          if (cartOffers?.length) {
            instructions.push(
              "Return JSON with reply, actionId and optional cartSelection. To offer to prepare the customer's cart, choose offerId, currencyId and integer quantity from the catalog below. Ask for clarification if the request is ambiguous. The customer must confirm the quote before the cart changes. When proposing a selection set actionId to null.",
              JSON.stringify(cartOffers),
            );
          }
          if (output === "pdf") {
            instructions.push(
              "Return a JSON object with reply (a question if details are missing), artifactText (the finished PDF content as plain text, or null if the brief is incomplete), and actionId (null or an allowed action).",
            );
          } else if (capability !== "image" && actions.length) {
            instructions.push(
              "Return a JSON object with reply (customer-facing text) and actionId (null or an allowed action).",
            );
          }
          if (capability !== "image" && actions.length) {
            instructions.push(
              "Choose a transition only when its instruction is satisfied. Allowed actions: " +
                JSON.stringify(actions),
            );
          }
          const requestProps = {
            provider: binding.provider,
            model: binding.model,
            maxOutputTokens: terms.maxOutputTokens,
            inputUsdPerMillion: terms.inputUsdPerMillion,
            outputUsdPerMillion: terms.outputUsdPerMillion,
            audioUsdPerMinute: terms.audioUsdPerMinute,
            messages: [
              {
                role: "system" as const,
                content: instructions.filter(Boolean).join("\n"),
              },
              ...(plan?.evidence ?? []),
              ...(plan?.historyLimit
                ? [
                    ...context.messages.filter(
                      (message) => message.role === "system",
                    ),
                    ...context.messages
                      .filter((message) => message.role !== "system")
                      .slice(-plan.historyLimit),
                  ]
                : context.messages),
            ],
          };
          let request: IWorkRequest | IImageWorkRequest | TNestedWorkRequest;
          if (step) {
            request = makeNestedRequest(step, requestProps);
          } else if (capability === "image") {
            request = { ...requestProps, capability };
          } else {
            request = {
              ...requestProps,
              capability: "text",
              actions,
              cartOffers,
              artifact: output === "pdf" ? "pdf" : undefined,
            };
          }
          let estimate;
          if (request.capability === "image") {
            estimate = estimateImageWork(request);
          } else if (
            request.capability === "vision" ||
            request.capability === "transcription" ||
            request.capability === "embedding"
          ) {
            estimate = estimateNestedWork(request);
          } else {
            estimate = estimateWork(request as IWorkRequest);
          }
          const maximum = estimate.usd
            .div(terms.usdPerSps)
            .times(terms.workMultiplier)
            .toDecimalPlaces(12, Decimal.ROUND_UP);
          if (
            estimate.input > terms.maxInputTokens ||
            estimate.usd.gt(terms.maxCostUsd) ||
            maximum.gt(funding.maxRunAmount) ||
            maximum.lte(0)
          ) {
            throw new Error(
              "Payment required. Provider operation exceeds its configured limits",
            );
          }

          const secret = await rbac.providerConnections.credential(
            storeId,
            assigneeId,
            capability,
            binding,
          );
          const attempt = await this.create({
            data: {
              ...input,
              capability,
              stepKey,
              requestDigest,
              publicationId: task.publicationId,
              sourceVersions: context.sourceVersions ?? [],
              stageId: stage.id,
              payerId,
              ownerId: binding.ownerId,
              currencyId: funding.currencyId,
              executorId: binding.executorId,
              connectionId: binding.connectionId,
              identityId: binding.identityId,
              credentialVersion: binding.version,
              provider: binding.provider,
              externalAccount: binding.externalAccount,
              model: binding.model,
              terms,
              maximum: maximum.toFixed(),
              state: "dispatching",
            },
          });
          await rbac.workLedger.reserve({
            storeId,
            taskId,
            actorId: assigneeId,
            senderId: payerId,
            recipientId: assigneeId,
            operationKey: reservationKey(attempt.id),
            purpose: "agent-work",
            currencyId: funding.currencyId,
            amount: maximum.toFixed(),
            budget: budget.toFixed(),
            eventId,
            runBudget: funding.maxRunAmount,
          });
          await this.projectExpense(attempt);
          const imageActionId =
            capability === "image" && actions.length === 1
              ? actions[0].id
              : undefined;
          return {
            attempt,
            outgoing: {
              request,
              secret,
              imageActionId,
              publicationId: task.publicationId,
            },
          };
        },
      );
    });
  }

  private recordReply(attempt: IModel, result: NonNullable<IModel["result"]>) {
    return this.repository.atomic(attempt.id, async () => {
      const current = await this.findById({ id: attempt.id });
      if (!current || !["dispatching", "unknown"].includes(current.state))
        throw new Error("Conflict error. Attempt is no longer pending");
      return this.change({
        id: current.id,
        data: {
          state: "received",
          providerRequestId: result.providerRequestId,
          result,
          updatedAt: now(),
        },
      });
    });
  }

  private settle(attempt: IModel) {
    return this.repository.atomic(attempt.id, async () => {
      const current = await this.findById({ id: attempt.id });
      if (!current || !current.result)
        throw new Error("Not found. Provider usage");
      if (current.state !== "received") return current;
      const compute = new Money(current.result.usage.usd).div(
        current.terms.usdPerSps,
      );
      const work = Money.min(
        current.maximum,
        compute.times(current.terms.workMultiplier),
      ).toDecimalPlaces(12, Decimal.ROUND_HALF_UP);
      const cost = Money.min(work, compute).toDecimalPlaces(
        12,
        Decimal.ROUND_HALF_UP,
      );
      if (compute.gt(current.maximum)) {
        // Store settings and funding acquire the store lock before the wallet locks.
        await this.modules.rbac.subject.providerConnections.suspend(
          current.storeId,
          current.connectionId,
          current.credentialVersion,
        );
      }
      const receipts = await this.modules.rbac.subject.workLedger.settle({
        storeId: current.storeId,
        reservationKey: reservationKey(current.id),
        recipientId: current.assigneeId,
        providerSubjectId: current.executorId,
        workAmount: work.toFixed(),
        providerAmount: cost.toFixed(),
      });
      return this.change({
        id: current.id,
        data: {
          state: "settled",
          workReceiptId: receipts.find(
            (row) => row.senderId === current.payerId,
          )?.id,
          expenseReceiptId: receipts.find(
            (row) => row.recipientId === current.executorId,
          )?.id,
          updatedAt: now(),
        },
      });
    });
  }

  private async finish(attempt: IModel) {
    let current =
      attempt.state === "received" ? await this.settle(attempt) : attempt;
    if (current.state === "settled" && current.stepKey !== "reply") {
      current = await this.repository.atomic(current.id, async () => {
        const latest = await this.findById({ id: current.id });
        if (!latest || latest.state !== "settled") {
          return latest ?? current;
        }
        let state: IModel["state"] =
          latest.result?.text.trim() || latest.result?.embeddings?.values.length
            ? "delivered"
            : "failed";
        if (latest.result?.indexing && state === "delivered") {
          try {
            state = (await new Maintenance(this).publish(latest))
              ? "delivered"
              : "stale";
          } catch (error) {
            if (
              !(error instanceof Error) ||
              !/^(Permission|Not Found|Conflict) error\./.test(error.message)
            ) {
              throw error;
            }
            state = "stale";
          }
        }
        return this.change({
          id: current.id,
          data: { state, updatedAt: now() },
        });
      });
      return { id: current.id, state: current.state };
    }
    if (current.state === "settled" && current.result) {
      const {
        storeId,
        taskId,
        assigneeId,
        eventId,
        assignmentRevision,
        id,
        result,
        stageId,
      } = current;
      try {
        current = await this.modules.crm.task.withWork(
          {
            storeId,
            taskId,
            assigneeId,
            expectedAssignmentRevision: assignmentRevision,
          },
          async ({ task, stage }) => {
            if (
              task.stageId !== stageId ||
              (current.publicationId &&
                current.publicationId !== task.publicationId) ||
              (result.artifact &&
                result.artifact.publicationId !== task.publicationId)
            ) {
              throw new Error("Conflict error. Stage changed before delivery");
            }
            const latestAttempt = await this.findById({ id });
            if (latestAttempt && latestAttempt.state !== "settled") {
              return latestAttempt;
            }
            const subject = this.modules.rbac.subject;
            let resultId = id;
            if (result.artifact) {
              const files = this.modules.fileStorage.privateFile;
              const [original, preview] = await Promise.all([
                files.findById({ id: result.artifact.originalFileId }),
                files.findById({ id: result.artifact.previewFileId }),
              ]);
              if (!original || !preview) {
                throw new Error("Not found. Prepared work artifact");
              }
              const version = await subject.orderWork.publishResultFromRun({
                storeId,
                taskId,
                assigneeId,
                assignmentRevision,
                attemptId: id,
                original: {
                  name: original.name,
                  mimeType: original.mimeType,
                  bytes: original.bytes,
                },
                preview: {
                  name: preview.name,
                  mimeType: preview.mimeType,
                  bytes: preview.bytes,
                },
              });
              resultId = version.id;
            } else if (result.text) {
              await subject.customerWork.deliverReply({
                storeId,
                taskId,
                assigneeId,
                eventId,
                assignmentRevision,
                attemptId: id,
                sourceVersions: current.sourceVersions,
                text: result.text,
                cartSelection: result.cartSelection,
              });
            }
            const action = stage.actions.find(
              (candidate) =>
                candidate.id === result.actionId &&
                candidate.actors.includes("ai") &&
                candidate.evidence.includes("model-result"),
            );
            const delivered = Boolean(result.artifact || result.text);
            if (action && delivered) {
              const latest = await this.modules.crm.task.get({
                storeId,
                taskId,
              });
              await this.modules.crm.task.transition({
                storeId,
                taskId,
                expectedRevision: latest.revision,
                expectedAssignmentRevision: assignmentRevision,
                actorId: assigneeId,
                actorKind: "ai",
                actionId: action.id,
                operationKey: `work-transition:${id}`,
                causeId: eventId,
                evidence: { kind: "model-result", resultId },
              });
            }
            return this.change({
              id,
              data: {
                state: delivered ? "delivered" : "failed",
                updatedAt: now(),
              },
            });
          },
        );
      } catch (error) {
        if (
          !(error instanceof Error) ||
          !error.message.startsWith("Conflict error.")
        )
          throw error;
        current = await this.repository.atomic(id, async () => {
          const latest = await this.findById({ id });
          if (latest && latest.state !== "settled") return latest;
          return this.change({
            id,
            data: { state: "stale", updatedAt: now() },
          });
        });
      }
    }
    return { id: current.id, state: current.state };
  }

  async dispatch(raw: IDispatch) {
    const input = requestSchema.parse(raw);
    const prior =
      (await this.previous({ ...input, capability: "text" })) ??
      (await this.previous({ ...input, capability: "image" }));
    if (prior) {
      return this.finish(prior);
    }
    const plan = await new Operations(this).plan(input, (step) =>
      this.executeStep(input, step),
    );
    if (plan.blocked) {
      return { id: plan.blocked.id, state: plan.blocked.state };
    }
    return this.execute(input, undefined, plan);
  }

  private async executeStep(input: IDispatch, step: IWorkStep) {
    const { id } = await this.execute(input, step);
    const attempt = await this.findById({ id });
    if (!attempt) {
      throw new Error("Not Found error. Paid operation was not recorded");
    }
    return attempt;
  }

  private async execute(
    input: IDispatch,
    step?: IWorkStep,
    plan?: Parameters<Service["prepare"]>[2],
  ) {
    const { attempt, outgoing } = await this.prepare(input, step, plan);
    if (!outgoing) {
      return this.finish(attempt);
    }
    const { request, secret } = outgoing;
    let response: {
      result: ICompletedWork & {
        embeddings?: { dimensions: number; values: number[][] };
      };
      bytes?: Uint8Array;
    };
    try {
      if (request.capability === "image") {
        response = await sendImageWork(request, secret, attempt.id);
      } else if (
        request.capability === "embedding" ||
        request.capability === "vision" ||
        request.capability === "transcription"
      ) {
        response = { result: await sendNestedWork(request, secret) };
      } else {
        response = { result: await sendWork(request as IWorkRequest, secret) };
      }
    } catch (error) {
      const rejected = error instanceof ProviderRejected;
      const state = rejected ? "failed" : "unknown";
      await this.repository.atomic(attempt.id, async () => {
        if (rejected)
          await this.modules.rbac.subject.workLedger.release(
            attempt.storeId,
            reservationKey(attempt.id),
          );
        return this.change({
          id: attempt.id,
          data: {
            state,
            providerRequestId:
              error instanceof ProviderOutcomeUnknown
                ? error.requestId
                : undefined,
            updatedAt: now(),
          },
        });
      });
      return { id: attempt.id, state };
    }
    const { artifactText, embeddings, ...reply } = response.result;
    if (step) {
      const index =
        step.input.capability === "embedding" ? step.input.indexing : undefined;
      const indexing =
        index && embeddings
          ? {
              sourceId: index.sourceId,
              contentHash: index.contentHash,
              indexKey: embeddingIndexKey(
                attempt.provider,
                attempt.model,
                embeddings.dimensions,
              ),
            }
          : undefined;
      const result = {
        ...reply,
        indexing,
        embeddings: embeddings
          ? { ...embeddings, model: attempt.model }
          : undefined,
      };
      return this.finish(await this.recordReply(attempt, result));
    }
    const orderWork = this.modules.rbac.subject.orderWork;
    const artifactFiles = response.bytes
      ? await orderWork
          .prepareImageResult(response.bytes)
          .catch(() => undefined)
      : artifactText &&
        (await orderWork
          .preparePdfResult(attempt.id, artifactText)
          .catch(() => undefined));
    if (!artifactFiles) {
      if ("artifact" in request && request.artifact === "pdf") {
        // A clarification can be delivered to the thread without completing
        // the stage. A failed conversion must never expose the PDF body.
        reply.actionId = undefined;
        reply.text = artifactText ? "" : reply.text.trim().slice(0, 600);
      }
      return this.finish(await this.recordReply(attempt, reply));
    }

    const received = await this.repository.atomic(attempt.id, async () => {
      const files = this.modules.fileStorage.privateFile;
      const original = await files.write(artifactFiles.original);
      const preview = await files.write(artifactFiles.preview);
      return this.recordReply(attempt, {
        ...reply,
        text: "",
        actionId:
          request.capability === "image"
            ? outgoing.imageActionId
            : reply.actionId,
        artifact: {
          originalFileId: original.id,
          previewFileId: preview.id,
          publicationId: outgoing.publicationId,
        },
      });
    });
    return this.finish(received);
  }

  async reconcile(limit = 30, storeId?: string) {
    const ledger = this.modules.rbac.subject.workLedger;
    const pending = await ledger.pendingReconciliations(limit, storeId);
    for (const record of pending) {
      try {
        await this.reconcileOne(record);
      } catch {
        logger.warn("Provider reconciliation deferred", {
          storeId: record.storeId,
          operationId: record.id,
        });
        await ledger.changeProviderWork(
          record.storeId,
          record.operationKey,
          (previous) => {
            if (!previous) throw new Error("Not found. Provider work receipt");
            return { ...previous, checkedAt: now().toISOString() };
          },
        );
      }
    }
  }

  private async reconcileOne(record: IWalletOperation) {
    const ledger = this.modules.rbac.subject.workLedger;
    const info = record.providerWork;
    if (!info) return;
    const attempt = await this.findById({ id: info.attemptId });
    if (
      !attempt ||
      attempt.storeId !== record.storeId ||
      attempt.connectionId !== info.connectionId
    )
      return;
    if (attempt.state === "received" || attempt.state === "settled") {
      await this.finish(attempt);
      return;
    }
    if (
      attempt.state === "dispatching" &&
      Date.now() - attempt.updatedAt.getTime() > 180_000
    ) {
      await this.repository.atomic(attempt.id, async () => {
        const latest = await this.findById({ id: attempt.id });
        if (latest?.state === "dispatching")
          await this.change({
            id: latest.id,
            data: { state: "unknown", updatedAt: now() },
          });
      });
    }
    const proof = info.resolution;
    if (proof && attempt.state === "unknown") {
      if (proof.kind === "charged") {
        const saved = await this.recordReply(attempt, {
          providerRequestId: attempt.providerRequestId ?? proof.reference,
          text: "",
          usage: {
            usd: proof.usd,
            inputTokens: proof.inputTokens,
            outputTokens: proof.outputTokens,
            basis: "owner-statement",
          },
        });
        await this.finish(saved);
      } else {
        await this.repository.atomic(attempt.id, async () => {
          const latest = await this.findById({ id: attempt.id });
          if (latest?.state !== "unknown") return;
          await ledger.release(record.storeId, record.operationKey);
          await this.change({
            id: latest.id,
            data: { state: "failed", updatedAt: now() },
          });
        });
      }
      return;
    }
    if (
      attempt.provider === "openrouter" &&
      attempt.providerRequestId &&
      ["unknown", "dispatching"].includes(attempt.state)
    ) {
      // A revoked or rotated credential requires an owner statement. Never send a second generation.
      const secret = await this.modules.rbac.subject.providerConnections
        .credential(attempt.storeId, attempt.assigneeId, attempt.capability, {
          identityId: attempt.identityId,
          version: attempt.credentialVersion,
        })
        .catch(() => undefined);
      const usage =
        secret &&
        (await readWorkUsage(attempt.providerRequestId, secret).catch(
          () => undefined,
        ));
      if (usage) {
        await this.finish(
          await this.recordReply(attempt, {
            providerRequestId: attempt.providerRequestId,
            usage,
            text: "",
          }),
        );
        return;
      }
    }
    await ledger.changeProviderWork(
      record.storeId,
      record.operationKey,
      (previous) => {
        if (!previous) throw new Error("Not found. Provider operation");
        return {
          ...previous,
          reconcileRequested: false,
          checkedAt: new Date().toISOString(),
        };
      },
    );
  }

  queueKnowledgeIndex(
    actorId: string,
    scope: { storeId: string; taskId: string },
  ) {
    return new Maintenance(this).queue(actorId, scope);
  }

  drainKnowledgeIndex(limit = 10) {
    return new Maintenance(this).drain(
      (delivery, step) =>
        this.executeStep(
          {
            storeId: delivery.storeId,
            taskId: delivery.taskId,
            eventId: delivery.eventId,
            assigneeId: delivery.assigneeId,
            assignmentRevision: delivery.assignmentRevision,
            capability: "text",
          },
          step,
        ),
      limit,
    );
  }

  async consumePayments(limit = 30) {
    const channel = this.modules.broadcast.channel;
    const slug = "order-work-payments";
    const events = await this.repository.atomic(slug, async () => {
      const [current] = await channel.find({
        params: {
          filters: { and: [{ column: "slug", method: "eq", value: slug }] },
          limit: 1,
        },
      });
      return (
        current ??
        channel.create({ data: { slug, title: "Order work payments" } })
      );
    });
    await this.modules.ecommerce.order.work.publishPaymentEvents(
      events.id,
      limit,
    );
    const batch = await channel.queue.reserve({
      channelId: events.id,
      concurrency: limit,
      leaseSeconds: 60,
    });
    for (const delivery of batch) {
      if (!(await channel.queue.start(delivery))) continue;
      try {
        const payload = z
          .object({ id: z.uuid(), orderId: z.uuid() })
          .safeParse(JSON.parse(delivery.payload));
        if (
          !payload.success ||
          delivery.key !== `order-work-payment:${payload.data.id}`
        ) {
          throw new Error("Invalid order payment event");
        }
        await this.modules.rbac.subject.orderWork.consumePayment({
          orderId: payload.data.orderId,
          eventId: payload.data.id,
        });
        await channel.queue.acknowledge(delivery);
      } catch {
        logger.warn("Order work payment deferred", {
          channelId: events.id,
          deliveryKey: delivery.key,
        });
        // Keep the failed item recoverable and allow other orders in this batch to finish.
        await channel.queue.release(delivery);
      }
    }
  }

  async processTimers(limit = 30) {
    const tasks = await this.modules.crm.task.listDueForWorker({ limit });
    for (const task of tasks) {
      if (task.timer) {
        const { storeId, id: taskId } = task;
        await this.modules.crm.task.applyTimer(
          { storeId, taskId, timerKey: task.timer.key },
          (event) =>
            this.modules.rbac.subject.customerWork.deliverReminder({
              storeId,
              taskId,
              eventId: event.id,
            }),
        );
      }
    }
  }

  async drain(limit = 30) {
    const intake = this.modules.rbac.subject.customerWork;
    const messages = await intake.listPendingWork({ limit });
    for (const item of messages) {
      try {
        const result = await this.dispatch(item);
        if (["delivered", "stale", "failed"].includes(result.state)) {
          await intake.ack({ eventId: item.eventId });
        } else {
          await intake.defer({ eventId: item.eventId });
        }
      } catch (error) {
        if (
          error instanceof Error &&
          error.message.startsWith("Conflict error.")
        ) {
          await intake.ack({ eventId: item.eventId });
        } else {
          await intake.defer({ eventId: item.eventId });
          if (
            !(error instanceof Error) ||
            !/^(Payment required|Permission error|Forbidden error)\./.test(
              error.message,
            )
          ) {
            logger.warn("Customer work deferred", {
              storeId: item.storeId,
              eventId: item.eventId,
            });
          }
        }
      }
    }
  }
}
