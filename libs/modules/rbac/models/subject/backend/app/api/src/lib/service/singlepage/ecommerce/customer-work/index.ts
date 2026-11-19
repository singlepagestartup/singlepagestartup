import { createHash, randomUUID } from "node:crypto";
import type { IModel as CrmTask } from "@sps/crm/models/task/sdk/model";
import {
  stageWorkCapabilities,
  type IWorkFunding,
} from "@sps/crm/models/funnel/sdk/model";
import { supportsNestedWork } from "@sps/shared-third-parties";
import { CUSTOMER_WORK_OFFER_CHOICE_REQUIRED } from "@sps/shared-utils";
import Decimal from "decimal.js";
import type { IModel as SocialMessage } from "@sps/social/models/message/sdk/model";
import type { IModel as SocialProfile } from "@sps/social/models/profile/sdk/model";
import { selectRetailOffer } from "@sps/ecommerce/relations/stores-to-products/sdk/model";
import type {
  ICustomerWorkCartOffer,
  ICustomerWorkMessage,
  ICustomerWorkOfferAvailability,
  ICustomerWorkOfferScope,
  ICustomerWorkPrice,
  ICustomerWorkReply,
  ICustomerWorkRun,
  ICustomerWorkScope,
  ICustomerWorkSourceVersion,
  ICustomerWorkView,
  IPendingCustomerWork,
  TCustomerWorkCommand,
} from "@sps/rbac/models/subject/sdk/model";
import type { Service as SubjectService } from "../../index";
import { Service as CustomerKnowledge } from "./knowledge";
import {
  prepareCustomerWorkMedia,
  storeCustomerWorkMedia,
  customerWorkMediaDigest,
  type TPreparedMedia,
} from "./media";
import { Service as CustomerDelivery } from "./delivery";
import { Service as CustomerCart, type IStoredProposal } from "./cart";
import { criteria } from "./utils";

type TOpenCustomerWork = Extract<
  TCustomerWorkCommand,
  { operation: "ask" | "add" }
>;
type TConversationCommand = Extract<
  TCustomerWorkCommand,
  { operation: "message" | "handoff" | "approve-budget" }
>;
type TMemoryCommand = Exclude<
  TCustomerWorkCommand,
  TOpenCustomerWork | TConversationCommand | { operation: "confirm-cart" }
>;

interface IMessageEntry {
  message: SocialMessage;
  profileId: string;
  profile: SocialProfile | null;
}

interface IThreadMessage {
  customerId: string;
  chatId: string;
  threadId: string;
  profileId: string;
  text: unknown;
  sourceSystemId?: string;
  hasAttachments: boolean;
  attachments?: File[];
}

export class Service {
  constructor(private readonly subject: SubjectService) {}

  private get crm() {
    return this.subject.modules.crm;
  }

  private get social() {
    return this.subject.modules.social;
  }

  private get knowledge() {
    return new CustomerKnowledge(this.subject);
  }

  private get cart() {
    return new CustomerCart(this.subject);
  }

  async expertForMaintenance(
    task: Pick<CrmTask, "storeId" | "productId" | "offerId">,
  ) {
    const expert = await this.knowledge.expert(task);
    if (expert.conflict) {
      throw new Error(
        "Conflict error. The store has competing expert assignments",
      );
    }
    return expert.profileId;
  }

  async execute(
    customerId: string,
    command: TCustomerWorkCommand,
  ): Promise<ICustomerWorkView> {
    if (command.operation === "ask" || command.operation === "add") {
      return this.open(customerId, command);
    }
    if (command.operation === "confirm-cart") {
      return this.subject.repository.withSubjectLock(
        { subjectId: customerId },
        async () => {
          await this.confirmCart(customerId, command, command.proposalId);
          return this.view(customerId, command);
        },
      );
    }
    if (
      command.operation === "memory-project" ||
      command.operation === "remember" ||
      command.operation === "forget"
    ) {
      return this.recordMemory(customerId, command);
    }
    return this.recordActivity(customerId, command);
  }

  async availability(
    scope: ICustomerWorkOfferScope,
  ): Promise<ICustomerWorkOfferAvailability> {
    const selection = await this.selection(scope);
    if (!selection) {
      return { consultation: false, order: false, payAfterAcceptance: false };
    }
    const service = selection.product.kind === "service";
    const [consultation, order] = await Promise.all([
      this.crm.funnel.resolve({ ...scope, kind: "consultation" }),
      this.crm.funnel.resolve({
        ...scope,
        kind: service ? "individual-service" : "physical-order",
      }),
    ]);
    const workOrder = Boolean(
      order && (!service || selection.offer.settings.requiresResultAcceptance),
    );
    return {
      consultation: Boolean(consultation),
      order: workOrder,
      payAfterAcceptance: workOrder && service,
    };
  }

  private async selection(scope: ICustomerWorkOfferScope) {
    const ecommerce = this.subject.modules.ecommerce;
    const [product, offers] = await Promise.all([
      ecommerce.product.findById({ id: scope.productId }),
      ecommerce.storesToProducts.offersForProduct({
        storeId: scope.storeId,
        productId: scope.productId,
      }),
    ]);
    if (!product) {
      return null;
    }
    const offer = selectRetailOffer({ ...scope, product, offers });
    return offer ? { offer, product } : null;
  }

  async openFromForm(input: {
    customerId: string;
    formId: string;
    requestId: string;
    title: string;
    storeId: string;
    funnelId: string;
  }) {
    return this.subject.repository.withSubjectLock(
      { subjectId: input.customerId },
      async () => {
        const key = `crm-form:${input.requestId}`;
        const [prior] = await this.crm.task.find(
          criteria({ storeId: input.storeId, openingKey: key }),
        );
        if (prior) {
          return prior;
        }
        const publication = await this.crm.funnel.current(
          input.storeId,
          input.funnelId,
        );
        if (!publication.bindings.formIds.includes(input.formId)) {
          throw new Error(
            "Conflict error. This form is unavailable for the published workflow",
          );
        }
        const selected = await this.formSelection(
          input.storeId,
          publication.bindings,
        );
        const task = await this.crm.task.open({
          ...input,
          ...selected,
          actorId: input.customerId,
          operationKey: key,
          causeId: input.requestId,
        });
        const { subjectId, profileId } = await this.ensureAssistant(
          input.customerId,
          input.storeId,
        );
        await this.createConversation(task, { title: input.title, profileId });
        await this.assignDefault(task, subjectId);
        return task;
      },
    );
  }

  private async formSelection(
    storeId: string,
    bindings: { productIds: string[]; offerIds: string[] },
  ) {
    const ecommerce = this.subject.modules.ecommerce;
    if (bindings.offerIds.length === 1) {
      const offer = await ecommerce.storesToProducts.findById({
        id: bindings.offerIds[0],
      });
      if (offer?.storeId === storeId) {
        const selected = await this.selection({
          storeId,
          offerId: offer.id,
          productId: offer.productId,
        });
        if (selected) {
          return { productId: selected.product.id, offerId: selected.offer.id };
        }
      }
    }
    if (bindings.offerIds.length || bindings.productIds.length !== 1) {
      return undefined;
    }
    const [productId] = bindings.productIds;
    const offers = await ecommerce.storesToProducts.offersForProduct({
      storeId,
      productId,
    });
    if (offers.length === 1) {
      const selected = await this.selection({
        storeId,
        offerId: offers[0].id,
        productId,
      });
      if (selected) {
        return { productId, offerId: selected.offer.id };
      }
    }
    return { productId };
  }

  async viewForOrder(customerId: string, storeId: string, orderId: string) {
    const matches = await this.crm.task.list({
      customerId,
      storeId,
      orderId,
      limit: 1,
    });
    const task = matches.items[0];
    if (!task) {
      return null;
    }
    return this.view(customerId, { storeId, taskId: task.id });
  }

  async closeRemovedOrder(input: { customerId: string; orderId: string }) {
    const [task] = await this.crm.task.find(criteria(input));
    if (!task || task.status === "closed") {
      return;
    }
    await this.crm.task.close({
      storeId: task.storeId,
      taskId: task.id,
      expectedRevision: task.revision,
      operationKey: `cart-removed:${input.orderId}`,
      actorId: input.customerId,
      reason: "cart-removed",
    });
  }

  async transferGuest(input: {
    guestId: string;
    customerId: string;
    removedOrderIds: string[];
    transferredOrderIds: string[];
  }) {
    const buyerProfile = await this.profileForSubject(input.guestId);
    if (!buyerProfile) {
      return;
    }
    const tasks = await this.crm.task.find(
      criteria({ customerId: input.guestId }),
    );
    for (const task of tasks) {
      const [threadLink] = await this.social.threadsToCrmModuleTasks.find(
        criteria({ crmModuleTaskId: task.id }),
      );
      if (!threadLink) {
        continue;
      }
      if (task.orderId && input.transferredOrderIds.includes(task.orderId)) {
        await this.subject.modules.ecommerce.order.work.transferCustomer({
          customerId: input.guestId,
          nextCustomerId: input.customerId,
          orderId: task.orderId,
          storeId: task.storeId,
          taskId: task.id,
        });
      } else if (
        task.orderId &&
        !input.removedOrderIds.includes(task.orderId)
      ) {
        const removal = await this.crm.taskEvent.byOperation(
          task.id,
          `cart-removed:${task.orderId}`,
        );
        if (removal?.kind !== "closed") {
          continue;
        }
      }
      const channel = await this.channel(task.id);
      const profileId = await this.ensureProfile(input.customerId, "customer");
      const [previousMembership] = await this.social.profilesToChats.find(
        criteria({ chatId: channel.chatId, profileId: buyerProfile.id }),
      );
      if (previousMembership) {
        await this.social.profilesToChats.delete({ id: previousMembership.id });
      }
      await this.social.profilesToChats.create({
        data: { chatId: channel.chatId, profileId },
      });
      const transferred = await this.crm.task.transferCustomer({
        storeId: task.storeId,
        taskId: task.id,
        expectedRevision: task.revision,
        previousCustomerId: input.guestId,
        customerId: input.customerId,
        actorId: input.customerId,
        operationKey: `guest-transfer:${input.guestId}`,
      });
      if (
        transferred.status === "closed" ||
        task.assigneeKind !== "ai" ||
        !task.assigneeId
      ) {
        continue;
      }
      const [guestAssistant] =
        await this.subject.module.subjectsToEcommerceModuleStores.find(
          criteria({
            customerSubjectId: input.guestId,
            ecommerceModuleStoreId: task.storeId,
            variant: "assistant",
          }),
        );
      let assigneeId = task.assigneeId;
      if (guestAssistant?.subjectId === task.assigneeId) {
        const assistant = await this.ensureAssistant(
          input.customerId,
          task.storeId,
        );
        assigneeId = assistant.subjectId;
        const previousProfile = await this.profileForSubject(
          guestAssistant.subjectId,
        );
        if (previousProfile) {
          const [previousAssistant] = await this.social.profilesToChats.find(
            criteria({ chatId: channel.chatId, profileId: previousProfile.id }),
          );
          if (previousAssistant) {
            await this.social.profilesToChats.delete({
              id: previousAssistant.id,
            });
          }
        }
        await this.social.profilesToChats.create({
          data: { chatId: channel.chatId, profileId: assistant.profileId },
        });
      }
      await this.crm.task.assign({
        taskId: task.id,
        storeId: task.storeId,
        expectedRevision: transferred.revision,
        actorId: input.customerId,
        assigneeId,
        assigneeKind: "ai",
        operationKey: `guest-assignment:${input.guestId}`,
        assignmentExpiresAt: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000,
        ).toISOString(),
      });
    }
  }

  async viewForThread(customerId: string, threadId: string) {
    const [link] = await this.social.threadsToCrmModuleTasks.find(
      criteria({ threadId }),
    );
    const task = link
      ? await this.crm.task.findById({ id: link.crmModuleTaskId })
      : null;
    if (!task || task.customerId !== customerId) {
      throw new Error(
        "Not Found error. The customer conversation could not be found",
      );
    }
    return this.view(customerId, { storeId: task.storeId, taskId: task.id });
  }

  async assertChatAccess({
    subjectId,
    chatId,
    edit,
  }: {
    subjectId: string;
    chatId: string;
    edit: boolean;
  }) {
    const chat = await this.social.chat.findById({ id: chatId });
    if (!chat) {
      return;
    }
    const threads = await this.social.chatsToThreads.find(criteria({ chatId }));
    const [thread] = threads;
    const [link] =
      thread && threads.length === 1
        ? await this.social.threadsToCrmModuleTasks.find(
            criteria({ threadId: thread.threadId }),
          )
        : [];
    if (!link && chat.variant !== "customer-work") {
      return;
    }
    const task = link
      ? await this.crm.task.findById({ id: link.crmModuleTaskId })
      : null;
    if (!task || task.customerId !== subjectId) {
      throw new Error(
        "Not Found error. The customer conversation could not be found",
      );
    }
    if (edit) {
      throw new Error(
        "Forbidden error. Use customer work operations to change this conversation",
      );
    }
  }

  async view(
    customerId: string,
    scope: ICustomerWorkScope,
  ): Promise<ICustomerWorkView> {
    const task = await this.taskForCustomer(customerId, scope);
    const publication = await this.crm.task.getPublication(scope);
    const funding = publication.definition.workFunding;
    const customerPays = funding?.payer === "customer";
    const price = customerPays ? await this.price(task, funding) : undefined;
    const approvedMaximum =
      customerPays && price
        ? await this.approvedMaximum(task, funding, task.revision, price.key)
        : undefined;
    const currency = customerPays
      ? await this.subject.modules.billing.currency.findById({
          id: funding.currencyId,
        })
      : undefined;
    const channel = await this.channel(task.id);
    const customerProfiles = await this.customerProfiles(task);
    const profile = await this.profileForSubject(customerId);
    const memory = profile
      ? await this.knowledge.memory({
          customerId,
          storeId: task.storeId,
          profileId: profile.id,
          projectId: channel.memoryProjectId,
        })
      : undefined;
    const entries = await this.messages(channel.threadId);
    const proposal = this.cartProposal(entries);
    const confirmed = proposal
      ? await this.crm.taskEvent.byOperation(
          task.id,
          `cart-consent:${proposal.id}`,
        )
      : undefined;
    const cartProposal =
      proposal &&
      (confirmed?.detail.orderId || this.cart.active(task, proposal))
        ? this.cart.summary(proposal, confirmed?.detail.orderId)
        : undefined;
    const assignee = task.assigneeId
      ? await this.profileForSubject(task.assigneeId)
      : undefined;
    const product = task.productId
      ? await this.subject.modules.ecommerce.product.findById({
          id: task.productId,
        })
      : null;
    const messages: ICustomerWorkMessage[] = [];
    for (const entry of entries) {
      if (!entry.message.description) {
        continue;
      }
      const customer = customerProfiles.has(entry.profileId);
      const name = customer
        ? "Вы"
        : (entry.profile?.title?.ru ?? entry.profile?.title?.en ?? "Магазин");
      messages.push({
        id: entry.message.id,
        author: name,
        kind: customer ? "customer" : "operator",
        body: entry.message.description,
      });
    }
    return {
      storeId: task.storeId,
      taskId: task.id,
      chatId: channel.chatId,
      threadId: channel.threadId,
      orderId: task.orderId ?? undefined,
      offerId: task.offerId ?? undefined,
      productSlug: product?.slug,
      consultationTaskId: channel.consultationTaskId ?? undefined,
      status: task.status,
      customerPays,
      requiredMaximum: customerPays ? funding.maxTaskAmount : undefined,
      fundingCurrency: currency?.slug?.toUpperCase(),
      price,
      approvedMaximum,
      memory,
      cartProposal,
      assignment:
        task.assigneeKind === "ai"
          ? "assistant"
          : task.assigneeKind === "human"
            ? "manager"
            : "unassigned",
      operator: assignee?.title?.ru ?? assignee?.title?.en,
      messages,
    };
  }

  private async taskForCustomer(customerId: string, scope: ICustomerWorkScope) {
    const task = await this.crm.task.get(scope);
    if (task.customerId !== customerId) {
      throw new Error(
        "Not Found error. The customer conversation could not be found",
      );
    }
    return task;
  }

  private async open(
    customerId: string,
    input: TOpenCustomerWork,
    proposal?: IStoredProposal,
  ) {
    return this.subject.repository.withSubjectLock(
      { subjectId: customerId },
      async () => {
        const customer = await this.subject.findById({ id: customerId });
        if (
          !customer ||
          customer.variant === "agent" ||
          customer.variant === "anonymous"
        ) {
          throw new Error("Forbidden error. A buyer session is required");
        }
        const ecommerce = this.subject.modules.ecommerce;
        const selection = await this.selection(input);
        if (!selection) {
          throw new Error("Not Found error. The selected offer is unavailable");
        }
        const { product, offer } = selection;
        const openingKey = `store-work:${customerId}:${input.operationKey}`;
        const [prior] = await this.crm.task.find(
          criteria({ storeId: input.storeId, openingKey }),
        );
        if (prior) {
          const publication = await this.crm.task.getPublication({
            taskId: prior.id,
            storeId: prior.storeId,
          });
          if (
            prior.offerId !== input.offerId ||
            (input.operation === "ask") !==
              (publication.kind === "consultation")
          ) {
            throw new Error(
              "Conflict error. This request key belongs to another operation",
            );
          }
          return this.view(customerId, {
            storeId: input.storeId,
            taskId: prior.id,
          });
        }
        const isCustomService = product.kind === "service";
        if (
          input.operation === "add" &&
          isCustomService &&
          !offer.settings.requiresResultAcceptance
        ) {
          throw new Error(
            "Validation error. This offer uses standard cart checkout",
          );
        }
        const kind =
          input.operation === "ask"
            ? "consultation"
            : isCustomService
              ? "individual-service"
              : "physical-order";
        const publication = await this.crm.funnel.resolve({ ...input, kind });
        if (!publication) {
          throw new Error(
            "Not Found error. The store has no published workflow for this offer",
          );
        }

        let orderId: string | undefined;
        let consultationTaskId: string | undefined;
        if (input.operation === "add") {
          if (
            await this.subject.ecommerceModuleProductInitialGrantIncludes({
              productId: input.productId,
            })
          ) {
            throw new Error(
              "Permission error. Initial grants use authentication bootstrap",
            );
          }
          if (input.consultationTaskId) {
            const consultation = await this.taskForCustomer(customerId, {
              storeId: input.storeId,
              taskId: input.consultationTaskId,
            });
            const consultationPublication = await this.crm.task.getPublication({
              storeId: input.storeId,
              taskId: consultation.id,
            });
            if (
              (consultation.offerId !== input.offerId &&
                proposal?.offerId !== input.offerId) ||
              consultationPublication.kind !== "consultation"
            ) {
              throw new Error(
                "Validation error. The consultation does not match this offer",
              );
            }
            consultationTaskId = consultation.id;
            if (isCustomService) {
              const existing = await this.cartTaskForConsultation(consultation);
              if (existing) {
                return this.view(customerId, {
                  storeId: existing.storeId,
                  taskId: existing.id,
                });
              }
            }
          }
          orderId = await this.orderForSelection(
            customerId,
            input,
            isCustomService,
          );
          const existing = await this.crm.task.list({
            storeId: input.storeId,
            customerId,
            orderId,
            limit: 1,
          });
          if (existing.items[0]) {
            return this.view(customerId, {
              storeId: input.storeId,
              taskId: existing.items[0].id,
            });
          }
        }
        const task = await this.crm.task.open({
          storeId: input.storeId,
          productId: product.id,
          offerId: offer.id,
          customerId,
          actorId: customerId,
          operationKey: openingKey,
          funnelId: publication.funnelId,
          orderId,
          causeId: consultationTaskId,
        });
        if (orderId && publication.kind !== "consultation") {
          await ecommerce.order.work.register({
            orderId,
            taskId: task.id,
            storeId: task.storeId,
            customerId,
            kind: publication.kind,
          });
        }
        const title =
          product.title?.ru ?? product.title?.en ?? product.adminTitle;
        const { subjectId, profileId } = await this.ensureAssistant(
          customerId,
          input.storeId,
        );
        await this.createConversation(task, {
          title,
          profileId,
          consultationTaskId,
        });
        await this.assignDefault(task, subjectId);
        return this.view(customerId, {
          storeId: task.storeId,
          taskId: task.id,
        });
      },
    );
  }

  private async cartTaskForConsultation(consultation: CrmTask) {
    const links = await this.social.threadsToCrmModuleTasks.find(
      criteria({ consultationTaskId: consultation.id }),
    );
    for (const { crmModuleTaskId } of links) {
      const task = await this.crm.task.findById({ id: crmModuleTaskId });
      if (
        task?.storeId !== consultation.storeId ||
        task.customerId !== consultation.customerId ||
        task.offerId !== consultation.offerId ||
        !task.orderId ||
        task.status === "closed"
      ) {
        continue;
      }
      const order = await this.subject.modules.ecommerce.order.findById({
        id: task.orderId,
      });
      if (order?.type === "cart" && order.status === "new") {
        return task;
      }
    }
    return null;
  }

  private async assignDefault(task: CrmTask, assistantId: string) {
    const current = await this.crm.task.getPublication({
      taskId: task.id,
      storeId: task.storeId,
    });
    const stage = current.definition.stages.find(
      ({ id }) => id === task.stageId,
    );
    const configured = stage?.defaultAssigneeSubjectId;
    const worker =
      configured && (await this.storeWorker(task, configured))
        ? await this.subject.findById({ id: configured })
        : null;
    if (worker?.variant === "agent") {
      await this.ensureProfile(worker.id, "assistant");
    }
    await this.crm.task.assign({
      storeId: task.storeId,
      taskId: task.id,
      expectedRevision: task.revision,
      actorId: task.customerId,
      operationKey: `assign-assistant:${task.id}`,
      assigneeId: worker?.id ?? assistantId,
      assigneeKind: worker && worker.variant !== "agent" ? "human" : "ai",
      assignmentExpiresAt: new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000,
      ).toISOString(),
    });
  }

  private cartProposal(entries: IMessageEntry[], proposalId?: string) {
    for (const { message } of [...entries].reverse()) {
      if (!message.workReplyKey?.startsWith("attempt:")) {
        continue;
      }
      const proposal = this.cart.read(
        message.metadata?.customerWorkCartProposal,
      );
      if (
        proposal &&
        message.workReplyKey === `attempt:${proposal.id}` &&
        (!proposalId || proposal.id === proposalId)
      ) {
        return proposal;
      }
    }
    return undefined;
  }

  private async confirmCart(
    customerId: string,
    scope: ICustomerWorkScope,
    proposalId: string,
  ) {
    const task = await this.taskForCustomer(customerId, scope);
    const operationKey = `cart-consent:${proposalId}`;
    const previous = await this.crm.taskEvent.byOperation(
      task.id,
      operationKey,
    );
    if (
      previous?.kind === "customer-cart-approved" &&
      previous.detail.orderId
    ) {
      return previous.detail.orderId;
    }
    const channel = await this.channel(task.id);
    const entries = await this.messages(channel.threadId);
    const proposal = this.cartProposal(entries, proposalId);
    if (!proposal) {
      throw new Error(
        "Not Found error. The cart suggestion could not be found",
      );
    }
    return this.crm.task.withWork(
      {
        ...scope,
        assigneeId: proposal.assigneeId,
        expectedAssignmentRevision: proposal.assignmentRevision,
      },
      async ({ task, stage }) => {
        if (
          task.customerId !== customerId ||
          !(await this.storeWorker(task, proposal.assigneeId))
        ) {
          throw new Error(
            "Forbidden error. The current assignment cannot add this offer",
          );
        }
        await this.requireInputEvent({
          ...scope,
          eventId: proposal.eventId,
          assigneeId: proposal.assigneeId,
          assignmentRevision: proposal.assignmentRevision,
        });
        const { product } = await this.cart.verify(task, stage, proposal);
        const orderId = await this.addProposedOrder(
          task,
          proposal,
          product.kind === "service",
        );
        await this.crm.task.activity({
          ...scope,
          actorId: customerId,
          expectedRevision: task.revision,
          operationKey,
          kind: "customer-cart-approved",
          causeId: proposal.eventId,
          orderId,
          cartSelection: {
            proposalId,
            offerId: proposal.offerId,
            currencyId: proposal.currencyId,
            quantity: proposal.quantity,
            amount: proposal.amount,
            quoteVersion: proposal.quoteVersion,
          },
        });
        return orderId;
      },
    );
  }

  private async addProposedOrder(
    task: CrmTask,
    proposal: IStoredProposal,
    separateService: boolean,
  ) {
    const { productId, offerId, storeId, quantity, currencyId, quoteVersion } =
      proposal;
    if (!separateService) {
      const orderId =
        await this.subject.ecommerceModuleFindOpenCartOrderWithProduct({
          subjectId: task.customerId,
          productId,
          offerId,
        });
      if (orderId) {
        const details =
          await this.subject.modules.ecommerce.order.findByIdCartDetails({
            id: orderId,
          });
        const [line] = details.lines;
        if (
          details.lines.length !== 1 ||
          line.quantity !== quantity ||
          details.billingModuleCurrencyId !== currencyId
        ) {
          throw new Error(
            "Conflict error. The cart already contains a different selection for this offer",
          );
        }
        return orderId;
      }
    }
    const selection = {
      quantity,
      billingModuleCurrencyId: currencyId,
      expectedQuoteVersion: quoteVersion,
    };
    const scope = { productId, offerId, storeId };
    const intake = await this.availability(scope);
    if (intake.order) {
      const publication = await this.crm.task.getPublication({
        taskId: task.id,
        storeId,
      });
      const created = await this.open(
        task.customerId,
        {
          ...scope,
          operation: "add",
          operationKey: proposal.id,
          selection,
          consultationTaskId:
            publication.kind === "consultation" ? task.id : undefined,
        },
        proposal,
      );
      if (created.orderId) {
        return created.orderId;
      }
      throw new Error(
        "Internal error. The confirmed cart order is unavailable",
      );
    }
    const created = await this.subject.ecommerceModuleOrderCreate({
      ...scope,
      ...selection,
      subjectId: task.customerId,
      separateService,
    });
    return created.orderId;
  }

  private async orderForSelection(
    customerId: string,
    input: Extract<TOpenCustomerWork, { operation: "add" }>,
    separateService: boolean,
  ) {
    if (!separateService) {
      const existing =
        await this.subject.ecommerceModuleFindOpenCartOrderWithProduct({
          subjectId: customerId,
          productId: input.productId,
          offerId: input.offerId,
        });
      if (existing) {
        return existing;
      }
    }
    const created = await this.subject.ecommerceModuleOrderCreate({
      ...input.selection,
      subjectId: customerId,
      productId: input.productId,
      offerId: input.offerId,
      storeId: input.storeId,
      quantity: input.selection.quantity ?? 1,
      billingModuleCurrencyId:
        input.selection.billingModule?.currency?.id ??
        input.selection.billingModuleCurrencyId,
      separateService,
    });
    return created.orderId;
  }

  private async profileForSubject(subjectId: string) {
    const [link] =
      await this.subject.module.subjectsToSocialModuleProfiles.find(
        criteria({ subjectId, variant: "default" }),
      );
    if (!link) {
      return undefined;
    }
    return this.social.profile.findById({ id: link.socialModuleProfileId });
  }

  private async customerProfiles(task: CrmTask) {
    const previous = await this.crm.taskEvent.find(
      criteria({ taskId: task.id, kind: "customer-transferred" }),
    );
    const subjectIds = new Set([task.customerId]);
    for (const event of previous) {
      if (event.detail.previousCustomerId) {
        subjectIds.add(event.detail.previousCustomerId);
      }
    }
    const profileIds = new Set<string>();
    for (const subjectId of subjectIds) {
      const profiles =
        await this.subject.module.subjectsToSocialModuleProfiles.find(
          criteria({ subjectId }),
        );
      for (const profile of profiles) {
        if (profile.variant === "default" || profile.variant === "telegram") {
          profileIds.add(profile.socialModuleProfileId);
        }
      }
    }
    return profileIds;
  }

  private async ensureProfile(
    subjectId: string,
    role: "customer" | "assistant",
  ) {
    const current = await this.profileForSubject(subjectId);
    if (current) {
      return current.id;
    }
    const assistant = role === "assistant";
    const profile = await this.social.profile.create({
      data: assistant
        ? {
            variant: "artificial-intelligence",
            title: { ru: "Личный ассистент", en: "Personal assistant" },
            adminTitle: "Customer assistant",
          }
        : {
            title: { ru: "Покупатель", en: "Customer" },
            adminTitle: "Store customer",
          },
    });
    await this.subject.module.subjectsToSocialModuleProfiles.create({
      data: { subjectId, socialModuleProfileId: profile.id },
    });
    return profile.id;
  }

  private async ensureAssistant(customerId: string, storeId: string) {
    const links = this.subject.module.subjectsToEcommerceModuleStores;
    const [current] = await links.find(
      criteria({
        customerSubjectId: customerId,
        ecommerceModuleStoreId: storeId,
        variant: "assistant",
      }),
    );
    if (current) {
      const profileId = await this.ensureProfile(
        current.subjectId,
        "assistant",
      );
      return { subjectId: current.subjectId, profileId };
    }
    const assistant = await this.subject.create({ data: { variant: "agent" } });
    await links.bindAssistant({
      subjectId: assistant.id,
      customerSubjectId: customerId,
      ecommerceModuleStoreId: storeId,
    });
    const profileId = await this.ensureProfile(assistant.id, "assistant");
    return { subjectId: assistant.id, profileId };
  }

  private async storeWorker(task: CrmTask, subjectId: string) {
    const roles =
      await this.subject.module.subjectsToEcommerceModuleStores.find(
        criteria({ subjectId, ecommerceModuleStoreId: task.storeId }),
      );
    return roles.some(
      (role) =>
        [
          "owner",
          "crm-manager",
          "crm-manager-finance",
          "crm-worker",
          "crm-agent",
        ].includes(role.variant) ||
        (role.variant === "assistant" &&
          role.customerSubjectId === task.customerId),
    );
  }

  private async price(
    task: CrmTask,
    funding: IWorkFunding,
  ): Promise<ICustomerWorkPrice | undefined> {
    if (task.assigneeKind !== "ai" || !task.assigneeId) {
      return undefined;
    }
    const publication = await this.crm.task.getPublication({
      taskId: task.id,
      storeId: task.storeId,
    });
    const stage = publication.definition.stages.find(
      ({ id }) => id === task.stageId,
    );
    if (!stage) {
      return undefined;
    }
    const rates: ICustomerWorkPrice["rates"] = [];
    const connectionIds: string[] = [];
    for (const capability of stageWorkCapabilities(stage)) {
      try {
        const binding = await this.subject.providerConnections.resolve(
          task.storeId,
          task.assigneeId,
          capability,
        );
        const { model, provider, terms } = binding;
        if (
          capability !== "text" &&
          capability !== "image" &&
          !supportsNestedWork(provider, model, capability)
        ) {
          return undefined;
        }
        rates.push({ model, provider, capability, ...terms });
        connectionIds.push(binding.connectionId);
      } catch (error) {
        if (
          !(error instanceof Error) ||
          !/^(Permission|Forbidden) error\./i.test(error.message)
        ) {
          throw error;
        }
        return undefined;
      }
    }
    const key = createHash("sha256")
      .update(
        JSON.stringify({
          publicationId: task.publicationId,
          stageId: task.stageId,
          funding,
          connectionIds,
          rates,
        }),
      )
      .digest("hex");
    return { key, rates };
  }

  private async approvedMaximum(
    task: CrmTask,
    funding: IWorkFunding,
    revision: number,
    priceKey: string,
  ) {
    const approvals = await this.crm.taskEvent.find({
      params: {
        filters: {
          and: [
            ...criteria({
              taskId: task.id,
              actorId: task.customerId,
              kind: "customer-budget-approved",
            }).params.filters.and,
            { column: "revision", method: "lte", value: revision },
          ],
        },
        orderBy: { and: [{ column: "revision", method: "desc" }] },
      },
    });
    return approvals.find(
      ({ detail }) =>
        detail.publicationId === task.publicationId &&
        detail.stageId === task.stageId &&
        detail.customerId === task.customerId &&
        detail.budgetCurrencyId === funding.currencyId &&
        detail.budgetPriceKey === priceKey,
    )?.detail.approvedMaximum;
  }

  private async createConversation(
    task: CrmTask,
    options: { title: string; profileId: string; consultationTaskId?: string },
  ) {
    const buyer = await this.ensureProfile(task.customerId, "customer");
    const chat = await this.social.chat.create({
      data: { title: options.title, variant: "customer-work" },
    });
    const chatId = chat.id;
    for (const profileId of [buyer, options.profileId]) {
      await this.social.profilesToChats.create({ data: { profileId, chatId } });
    }
    const thread = await this.social.thread.create({
      data: { title: options.title, variant: "default" },
    });
    await this.social.chatsToThreads.create({
      data: { chatId, threadId: thread.id, variant: "default" },
    });
    await this.social.threadsToCrmModuleTasks.create({
      data: {
        threadId: thread.id,
        crmModuleTaskId: task.id,
        consultationTaskId: options.consultationTaskId,
      },
    });
  }

  private async channel(taskId: string) {
    const [thread] = await this.social.threadsToCrmModuleTasks.find(
      criteria({ crmModuleTaskId: taskId }),
    );
    if (!thread) {
      throw new Error(
        "Not Found error. No private thread is linked to this task",
      );
    }
    const [chat] = await this.social.chatsToThreads.find(
      criteria({ threadId: thread.threadId }),
    );
    if (!chat) {
      throw new Error(
        "Not Found error. No private chat is linked to this thread",
      );
    }
    return {
      id: thread.id,
      threadId: thread.threadId,
      chatId: chat.chatId,
      consultationTaskId: thread.consultationTaskId,
      memoryProjectId: thread.memoryProjectId,
    };
  }

  private async messages(threadId: string) {
    const links = await this.social.threadsToMessages.find({
      ...criteria({ threadId }),
      params: {
        ...criteria({ threadId }).params,
        limit: 100,
        orderBy: {
          and: [
            { column: "createdAt", method: "desc" },
            { column: "id", method: "desc" },
          ],
        },
      },
    });
    const entries: IMessageEntry[] = [];
    for (const link of links.reverse()) {
      const message = await this.social.message.findById({
        id: link.messageId,
      });
      if (!message || message.variant !== "customer-work") {
        continue;
      }
      const [profileLink] = await this.social.profilesToMessages.find(
        criteria({ messageId: message.id }),
      );
      if (!profileLink) {
        continue;
      }
      const profile = await this.social.profile.findById({
        id: profileLink.profileId,
      });
      entries.push({ message, profileId: profileLink.profileId, profile });
    }
    return entries;
  }

  private async writeMessage(props: {
    chatId: string;
    threadId: string;
    profileId: string;
    text: string;
    sourceSystemId?: string;
    sourceVersions?: ICustomerWorkSourceVersion[];
    media?: TPreparedMedia;
    cartProposal?: IStoredProposal;
  }) {
    let metadata: Record<string, unknown> | undefined;
    if (props.sourceVersions) {
      metadata = { customerWorkSourceVersions: props.sourceVersions };
    }
    if (props.media) {
      metadata = {
        ...metadata,
        customerWorkMedia: await storeCustomerWorkMedia(
          this.subject,
          props.media,
        ),
      };
    }
    if (props.cartProposal) {
      metadata = { ...metadata, customerWorkCartProposal: props.cartProposal };
    }
    const message = await this.social.message.create({
      data: {
        variant: "customer-work",
        description: props.text,
        metadata,
        sourceSystemId: props.sourceSystemId,
      },
    });
    await this.social.profilesToMessages.create({
      data: { profileId: props.profileId, messageId: message.id },
    });
    await this.social.chatsToMessages.create({
      data: { chatId: props.chatId, messageId: message.id },
    });
    await this.social.threadsToMessages.create({
      data: { threadId: props.threadId, messageId: message.id },
    });
    return message;
  }

  async messageFromThread(input: IThreadMessage) {
    const [link] = await this.social.threadsToCrmModuleTasks.find(
      criteria({ threadId: input.threadId }),
    );
    const text = typeof input.text === "string" ? input.text.trim() : "";
    const selection =
      !link && !input.hasAttachments && text && !text.startsWith("/")
        ? await this.threadSelection(input)
        : null;
    if (!link && !selection) {
      return null;
    }
    return this.subject.repository.withSubjectLock(
      { subjectId: input.customerId },
      async () => {
        const [current] = await this.social.threadsToCrmModuleTasks.find(
          criteria({ threadId: input.threadId }),
        );
        const task = current
          ? await this.crm.task.findById({ id: current.crmModuleTaskId })
          : selection
            ? await this.openFromThread(input, selection)
            : null;
        const [owner] =
          await this.subject.module.subjectsToSocialModuleProfiles.find(
            criteria({
              subjectId: input.customerId,
              socialModuleProfileId: input.profileId,
            }),
          );
        const [membership] = await this.social.profilesToChats.find(
          criteria({ chatId: input.chatId, profileId: input.profileId }),
        );
        if (
          !task ||
          task.customerId !== input.customerId ||
          !owner ||
          !["default", "telegram"].includes(owner.variant) ||
          !membership
        ) {
          throw new Error(
            "Not Found error. The customer conversation could not be found",
          );
        }
        const channel = await this.channel(task.id);
        if (
          channel.chatId !== input.chatId ||
          channel.threadId !== input.threadId
        ) {
          throw new Error(
            "Not Found error. The customer conversation could not be found",
          );
        }
        if (
          !text ||
          text.length > 8000 ||
          (input.hasAttachments && input.attachments?.length !== 1)
        ) {
          throw new Error(
            "Validation error. Send a text message of up to 8000 characters with at most one attachment",
          );
        }
        let media: TPreparedMedia | undefined;
        if (input.attachments?.[0]) {
          const publication = await this.crm.task.getPublication({
            storeId: task.storeId,
            taskId: task.id,
          });
          const stage = publication.definition.stages.find(
            (candidate) => candidate.id === task.stageId,
          );
          media = await prepareCustomerWorkMedia(
            input.attachments[0],
            stage?.operations ?? [],
          );
        }
        const command = {
          operation: "message" as const,
          storeId: task.storeId,
          taskId: task.id,
          operationKey: input.sourceSystemId
            ? createHash("sha256").update(input.sourceSystemId).digest("hex")
            : randomUUID(),
          text,
        };
        const result = await this.recordActivity(input.customerId, command, {
          profileId: input.profileId,
          sourceSystemId: input.sourceSystemId,
          media,
        });
        const key = this.activityKey(input.customerId, command.operationKey);
        const event = await this.crm.taskEvent.byOperation(result.taskId, key);
        const message = event?.detail.messageId
          ? await this.social.message.findById({ id: event.detail.messageId })
          : null;
        if (!message) {
          throw new Error(
            "Internal error. The saved conversation message is unavailable",
          );
        }
        return message;
      },
    );
  }

  private async threadSelection(input: IThreadMessage) {
    const [products, chat] = await Promise.all([
      this.social.threadsToEcommerceModuleProducts.find(
        criteria({ threadId: input.threadId }),
      ),
      this.social.chat.findById({ id: input.chatId }),
    ]);
    if (!chat || !products.length || chat.sourceSystemId?.startsWith("-")) {
      return null;
    }
    const threads = await this.social.chatsToThreads.find(
      criteria({ chatId: input.chatId }),
    );
    if (threads.length !== 1 || threads[0].threadId !== input.threadId) {
      return null;
    }
    const memberships = await this.social.profilesToChats.find(
      criteria({ chatId: input.chatId }),
    );
    const otherMembers = memberships.filter(
      ({ profileId }) => profileId !== input.profileId,
    );
    for (const { profileId } of otherMembers) {
      const profile = await this.social.profile.findById({ id: profileId });
      if (
        profile?.variant !== "artificial-intelligence" &&
        profile?.slug !== "telegram-bot"
      ) {
        return null;
      }
    }
    const candidates: Array<
      ICustomerWorkOfferScope & { funnelId: string; title: string }
    > = [];
    const ecommerce = this.subject.modules.ecommerce;
    for (const { ecommerceModuleProductId: productId } of products) {
      const [offers, product] = await Promise.all([
        ecommerce.storesToProducts.offersForProduct({ productId }),
        ecommerce.product.findById({ id: productId }),
      ]);
      if (!product) {
        continue;
      }
      for (const offer of offers) {
        if (
          !selectRetailOffer({ offers: [offer], product, offerId: offer.id })
        ) {
          continue;
        }
        const scope = { storeId: offer.storeId, productId, offerId: offer.id };
        const publication = await this.crm.funnel.resolve({
          ...scope,
          kind: "consultation",
        });
        if (publication) {
          candidates.push({
            ...scope,
            funnelId: publication.funnelId,
            title: product.title?.en ?? product.adminTitle,
          });
        }
      }
    }
    if (candidates.length > 1) {
      throw new Error(CUSTOMER_WORK_OFFER_CHOICE_REQUIRED);
    }
    return candidates[0] ?? null;
  }

  private async openFromThread(
    input: IThreadMessage,
    selection: ICustomerWorkOfferScope & { funnelId: string },
  ) {
    const task = await this.crm.task.open({
      ...selection,
      actorId: input.customerId,
      customerId: input.customerId,
      operationKey: `channel-intake:${input.threadId}`,
    });
    const assistant = await this.ensureAssistant(
      input.customerId,
      selection.storeId,
    );
    await this.social.threadsToCrmModuleTasks.create({
      data: { threadId: input.threadId, crmModuleTaskId: task.id },
    });
    await this.social.profilesToChats.create({
      data: { chatId: input.chatId, profileId: assistant.profileId },
    });
    await this.assignDefault(task, assistant.subjectId);
    return this.crm.task.get({ taskId: task.id, storeId: task.storeId });
  }

  private activityKey(customerId: string, key: string) {
    return `store-work:${customerId}:${key}`;
  }

  private async recordMemory(customerId: string, command: TMemoryCommand) {
    return this.subject.repository.withSubjectLock(
      { subjectId: customerId },
      async () => {
        const task = await this.taskForCustomer(customerId, command);
        const profile = await this.profileForSubject(customerId);
        if (!profile) {
          throw new Error(
            "Not Found error. The customer profile is unavailable",
          );
        }
        const thread = await this.channel(task.id);
        await this.knowledge.record(
          {
            customerId,
            storeId: task.storeId,
            profileId: profile.id,
            projectId: thread.memoryProjectId,
          },
          thread,
          command,
        );
        return this.view(customerId, command);
      },
    );
  }

  private async recordActivity(
    customerId: string,
    command: TConversationCommand,
    author?: {
      profileId: string;
      sourceSystemId?: string;
      media?: TPreparedMedia;
    },
  ) {
    return this.subject.repository.withSubjectLock(
      { subjectId: customerId },
      async () => {
        const task = await this.taskForCustomer(customerId, command);
        const channel = await this.channel(task.id);
        const operationKey = this.activityKey(customerId, command.operationKey);
        const event = await this.crm.taskEvent.byOperation(
          task.id,
          operationKey,
        );
        if (event) {
          const expected = {
            message: "customer-message",
            handoff: "customer-handoff-requested",
            "approve-budget": "customer-budget-approved",
          }[command.operation];
          if (event.kind !== expected) {
            throw new Error(
              "Conflict error. This request key belongs to another operation",
            );
          }
          if (command.operation === "message" && event.detail.messageId) {
            const previous = await this.social.message.findById({
              id: event.detail.messageId,
            });
            const metadata = previous?.metadata as
              { customerWorkMedia?: { digest?: string } } | undefined;
            const digest =
              author?.media && customerWorkMediaDigest(author.media);
            if (
              previous?.description !== command.text ||
              metadata?.customerWorkMedia?.digest !== digest
            ) {
              throw new Error(
                "Conflict error. This request key belongs to another message",
              );
            }
          }
          if (
            command.operation === "approve-budget" &&
            (event.detail.approvedMaximum !== command.maximum ||
              event.detail.budgetPriceKey !== command.priceKey)
          ) {
            throw new Error(
              "Conflict error. This request key belongs to another spending limit",
            );
          }
          return this.view(customerId, command);
        }
        const activity = {
          storeId: task.storeId,
          taskId: task.id,
          actorId: customerId,
          expectedRevision: task.revision,
          operationKey,
        };
        if (command.operation === "approve-budget") {
          const session = await this.subject.authenticationMe({
            subjectId: customerId,
          });
          if (!session?.authenticated) {
            throw new Error("Forbidden error. Sign in to authorize spending");
          }
          const publication = await this.crm.task.getPublication(command);
          const funding = publication.definition.workFunding;
          const price =
            funding?.payer === "customer"
              ? await this.price(task, funding)
              : undefined;
          if (
            !funding ||
            !price ||
            price.key !== command.priceKey ||
            !new Decimal(command.maximum).eq(funding.maxTaskAmount)
          ) {
            throw new Error(
              "Conflict error. Reload the current work price before approving",
            );
          }
          await this.crm.task.activity({
            ...activity,
            kind: "customer-budget-approved",
            approvedMaximum: command.maximum,
            priceKey: price.key,
            rates: price.rates.map((rate) => ({ ...rate })),
          });
          return this.view(customerId, command);
        }
        if (command.operation === "handoff") {
          if (task.assigneeKind === "ai") {
            await this.crm.task.activity({
              ...activity,
              kind: "customer-handoff-requested",
            });
          }
          return this.view(customerId, command);
        }
        const profileId =
          author?.profileId ??
          (await this.ensureProfile(customerId, "customer"));
        const personalProfile = await this.profileForSubject(customerId);
        const remembered =
          personalProfile &&
          (await this.knowledge.rememberFromMessage(
            {
              customerId,
              storeId: task.storeId,
              profileId: personalProfile.id,
              projectId: channel.memoryProjectId,
            },
            channel,
            { ...command, operationKey },
          ));
        const message = await this.writeMessage({
          ...channel,
          text: command.text,
          profileId,
          sourceSystemId: author?.sourceSystemId,
          media: author?.media,
        });
        const recorded = await this.crm.task.activity({
          ...activity,
          kind: "customer-message",
          messageId: message.id,
        });
        const isConfirmation =
          !author?.media &&
          /^(?:add (?:this choice )?to my cart|добавить (?:предложение )?в корзину)[.!]?$/iu.test(
            command.text,
          );
        const proposal = isConfirmation
          ? this.cartProposal(await this.messages(channel.threadId))
          : undefined;
        if (proposal) {
          await this.confirmCart(customerId, command, proposal.id);
        }
        const current = await this.crm.task.getPublication(command);
        const funding = current.definition.workFunding;
        const price =
          funding?.payer === "customer"
            ? await this.price(recorded.task, funding)
            : undefined;
        const approved =
          funding?.payer !== "customer" ||
          (price &&
            (await this.approvedMaximum(
              recorded.task,
              funding,
              recorded.event.revision,
              price.key,
            )));
        const expert = await this.knowledge.expert(recorded.task);
        if (expert.conflict && recorded.task.assigneeKind === "ai") {
          await this.crm.task.activity({
            ...activity,
            expectedRevision: recorded.task.revision,
            operationKey: `expert-conflict:${message.id}`,
            kind: "customer-handoff-requested",
          });
        }
        await this.social.messagesToCrmModuleTaskEvents.create({
          data: {
            messageId: message.id,
            crmModuleTaskEventId: recorded.event.id,
            pending:
              !remembered &&
              !proposal &&
              Boolean(funding && approved) &&
              !expert.conflict &&
              recorded.task.assigneeKind === "ai" &&
              recorded.task.status === "active",
          },
        });
        return this.view(customerId, command);
      },
    );
  }

  async listPendingWork(
    input: { limit?: number } = {},
  ): Promise<IPendingCustomerWork[]> {
    const limit = Math.min(100, Math.max(1, input.limit ?? 50));
    const queue = await this.social.messagesToCrmModuleTaskEvents.find({
      params: {
        ...criteria({ pending: true }).params,
        limit,
        orderBy: {
          and: [
            { column: "updatedAt", method: "asc" },
            { column: "id", method: "asc" },
          ],
        },
      },
    });
    const work: IPendingCustomerWork[] = [];
    for (const item of queue) {
      const event = await this.crm.taskEvent.findById({
        id: item.crmModuleTaskEventId,
      });
      const task = event
        ? await this.crm.task.findById({ id: event.taskId })
        : null;
      if (
        !task ||
        !event?.detail.assigneeId ||
        event.kind !== "customer-message" ||
        task.stageId !== event.detail.stageId ||
        task.assigneeId !== event.detail.assigneeId ||
        task.assignmentRevision !== event.assignmentRevision ||
        task.status === "closed" ||
        (task.assignmentExpiresAt && task.assignmentExpiresAt <= new Date())
      ) {
        await this.ack({ eventId: item.crmModuleTaskEventId });
        continue;
      }
      if (task.status !== "active") {
        await this.defer({ eventId: event.id });
        continue;
      }
      work.push({
        taskId: task.id,
        storeId: task.storeId,
        eventId: event.id,
        assigneeId: event.detail.assigneeId,
        assignmentRevision: event.assignmentRevision,
        capability: "text",
      });
    }
    return work;
  }

  async pendingForMessage(input: {
    messageId: string;
    threadId: string;
  }): Promise<IPendingCustomerWork | null> {
    const [link] = await this.social.threadsToMessages.find(criteria(input));
    const [record] = await this.social.messagesToCrmModuleTaskEvents.find(
      criteria({ messageId: input.messageId, pending: true }),
    );
    if (!link || !record) {
      return null;
    }
    const [work] = await this.social.threadsToCrmModuleTasks.find(
      criteria({ threadId: input.threadId }),
    );
    const event = await this.crm.taskEvent.findById({
      id: record.crmModuleTaskEventId,
    });
    if (!work || !event || event.taskId !== work.crmModuleTaskId) {
      return null;
    }
    const task = await this.crm.task.findById({ id: event.taskId });
    if (
      !task ||
      task.status !== "active" ||
      event.kind !== "customer-message" ||
      task.stageId !== event.detail.stageId ||
      !event.detail.assigneeId ||
      task.assigneeId !== event.detail.assigneeId ||
      task.assignmentRevision !== event.assignmentRevision ||
      (task.assignmentExpiresAt && task.assignmentExpiresAt <= new Date())
    ) {
      return null;
    }
    return {
      eventId: event.id,
      taskId: task.id,
      storeId: task.storeId,
      assigneeId: event.detail.assigneeId,
      assignmentRevision: event.assignmentRevision,
      capability: "text",
    };
  }

  async ack(input: { eventId: string }) {
    await this.social.messagesToCrmModuleTaskEvents.updatePending(
      input.eventId,
      false,
    );
  }

  async defer(input: { eventId: string }) {
    await this.social.messagesToCrmModuleTaskEvents.updatePending(
      input.eventId,
      true,
    );
  }

  async contextForRun(input: ICustomerWorkRun): Promise<{
    messages: { role: "system" | "user" | "assistant"; content: string }[];
    approvedMaximum?: string;
    sourceVersions: ICustomerWorkSourceVersion[];
    knowledgeSourceIds?: string[];
    media?: { id: string; digest: string; mimeType: string };
    cartOffers?: ICustomerWorkCartOffer[];
  }> {
    const { task, stage, funding } = await this.crm.task.getWork({
      ...input,
      expectedAssignmentRevision: input.assignmentRevision,
    });
    const event = await this.requireInputEvent(input);
    if (!(await this.storeWorker(task, input.assigneeId))) {
      throw new Error(
        "Forbidden error. The agent no longer belongs to the store",
      );
    }
    const channel = await this.channel(task.id);
    const customerProfiles = await this.customerProfiles(task);
    const entries = await this.messages(channel.threadId);
    const messages: {
      role: "system" | "user" | "assistant";
      content: string;
    }[] = [];
    const trigger = entries.find(
      ({ message }) => message.id === event.detail.messageId,
    );
    if (
      !trigger ||
      !customerProfiles.has(trigger.profileId) ||
      !trigger.message.description
    ) {
      throw new Error(
        "Conflict error. The triggering message is outside the active conversation",
      );
    }
    const customerProfile = await this.profileForSubject(task.customerId);
    const session = await this.subject.authenticationMe({
      subjectId: task.customerId,
    });
    const references = await this.knowledge.context(
      task,
      session?.authenticated && customerProfile
        ? {
            customerId: task.customerId,
            profileId: customerProfile.id,
            storeId: task.storeId,
            projectId: channel.memoryProjectId,
          }
        : undefined,
      trigger.message.description,
    );
    if (references.content) {
      messages.push({ role: "system", content: references.content });
    }
    for (const { message, profileId } of entries) {
      if (!message.description || message.workReplyKey) {
        continue;
      }
      messages.push({
        role: customerProfiles.has(profileId) ? "user" : "assistant",
        content: message.description,
      });
      if (message.id === event.detail.messageId) {
        break;
      }
    }
    const customerPays = funding?.payer === "customer";
    const price = customerPays ? await this.price(task, funding) : undefined;
    const approvedMaximum =
      customerPays && price
        ? await this.approvedMaximum(task, funding, event.revision, price.key)
        : undefined;
    if (customerPays && (!approvedMaximum || !session?.authenticated)) {
      throw new Error(
        "Forbidden error. The customer must approve a spending limit before work",
      );
    }
    const media = (
      trigger.message.metadata as
        | {
            customerWorkMedia?: {
              id: string;
              digest: string;
              mimeType: string;
            };
          }
        | undefined
    )?.customerWorkMedia;
    const cartOffers = stage.cartOfferIds?.length
      ? await this.cart.offers(task, stage)
      : undefined;
    return {
      messages,
      approvedMaximum,
      sourceVersions: references.sourceVersions,
      knowledgeSourceIds: references.knowledgeSourceIds,
      media,
      cartOffers,
    };
  }

  private async requireInputEvent(input: ICustomerWorkRun) {
    const event = await this.crm.taskEvent.findById({ id: input.eventId });
    if (
      !event ||
      event.taskId !== input.taskId ||
      event.kind !== "customer-message" ||
      event.detail.assigneeId !== input.assigneeId ||
      event.assignmentRevision !== input.assignmentRevision
    ) {
      throw new Error(
        "Forbidden error. The triggering event does not match the task assignment",
      );
    }
    return event;
  }

  async deliverReply(input: ICustomerWorkReply) {
    const key = `attempt:${input.attemptId}`;
    const service = this.crm.task;
    return service.withWork(
      { ...input, expectedAssignmentRevision: input.assignmentRevision },
      async ({ task, stage }) => {
        await this.requireInputEvent(input);
        const [previous] = await this.social.message.find(
          criteria({ workReplyKey: key }),
        );
        if (previous) {
          return { messageId: previous.id };
        }
        const profile = await this.profileForSubject(input.assigneeId);
        if (
          !profile ||
          task.assigneeKind !== "ai" ||
          !input.text.trim() ||
          !(await this.storeWorker(task, input.assigneeId))
        ) {
          throw new Error(
            "Forbidden error. The current agent cannot send a response",
          );
        }
        const channel = await this.channel(task.id);
        const cartProposal = input.cartSelection
          ? await this.cart.propose(
              {
                ...input,
                selection: input.cartSelection,
              },
              task,
              stage,
            )
          : undefined;
        let text = input.text;
        if (cartProposal) {
          const chat = await this.social.chat.findById({ id: channel.chatId });
          if (chat?.variant === "telegram") {
            text += `\n\n${cartProposal.title}, ${cartProposal.quantity} ×, ${cartProposal.amount} ${cartProposal.currency.toUpperCase()}. Чтобы принять, ответьте «Добавить в корзину».`;
          }
        }
        const message = await this.writeMessage({
          ...channel,
          profileId: profile.id,
          text,
          sourceVersions: input.sourceVersions,
          cartProposal,
        });
        await this.social.message.bindWorkReply(message.id, key);
        await new CustomerDelivery(this.subject).queue({
          ...channel,
          customerId: task.customerId,
          message,
        });
        return { messageId: message.id };
      },
    );
  }

  async deliverReminder(input: ICustomerWorkScope & { eventId: string }) {
    const task = await this.crm.task.get(input);
    const event = await this.crm.taskEvent.findById({ id: input.eventId });
    if (
      event?.kind !== "reminder-due" ||
      event.taskId !== task.id ||
      task.status !== "waiting" ||
      event.assignmentRevision !== task.assignmentRevision ||
      event.detail.customerId !== task.customerId ||
      event.detail.publicationId !== task.publicationId ||
      event.detail.stageId !== task.stageId ||
      event.detail.waitingRevision !== task.waitingRevision ||
      !task.deadlineAt ||
      task.deadlineAt <= new Date()
    ) {
      return;
    }
    const key = `reminder:${event.id}`;
    const [previous] = await this.social.message.find(
      criteria({ workReplyKey: key }),
    );
    if (previous) {
      return { messageId: previous.id };
    }
    const [link] = await this.social.threadsToCrmModuleTasks.find(
      criteria({ crmModuleTaskId: task.id }),
    );
    if (!link) {
      return;
    }
    const channel = await this.channel(task.id);
    const [assistant] =
      await this.subject.module.subjectsToEcommerceModuleStores.find(
        criteria({
          customerSubjectId: task.customerId,
          ecommerceModuleStoreId: task.storeId,
          variant: "assistant",
        }),
      );
    if (!assistant) {
      return;
    }
    const profile = await this.profileForSubject(assistant.subjectId);
    if (!profile) {
      return;
    }
    const message = await this.writeMessage({
      ...channel,
      profileId: profile.id,
      text: "Please check the latest request when you have a moment. / Пожалуйста, проверьте последнее обращение, когда будет удобно.",
    });
    await this.social.message.bindWorkReply(message.id, key);
    await new CustomerDelivery(this.subject).queue({
      ...channel,
      customerId: task.customerId,
      message,
    });
    return { messageId: message.id };
  }
}
