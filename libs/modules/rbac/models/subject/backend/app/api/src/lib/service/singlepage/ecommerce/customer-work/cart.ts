import { z } from "zod";
import type { IFunnelStage } from "@sps/crm/models/funnel/sdk/model";
import type { IModel as Task } from "@sps/crm/models/task/sdk/model";
import { selectRetailOffer } from "@sps/ecommerce/relations/stores-to-products/sdk/model";
import {
  customerWorkCartSelectionSchema,
  type ICustomerWorkCartOffer,
  type ICustomerWorkCartProposal,
  type ICustomerWorkCartSelection,
  type ICustomerWorkRun,
} from "@sps/rbac/models/subject/sdk/model";
import type { Service as SubjectService } from "../../index";

const proposalSchema = customerWorkCartSelectionSchema.extend({
  id: z.uuid(),
  storeId: z.uuid(),
  taskId: z.uuid(),
  productId: z.uuid(),
  eventId: z.uuid(),
  publicationId: z.uuid(),
  stageId: z.string(),
  assigneeId: z.uuid(),
  assignmentRevision: z.number().int(),
  title: z.string(),
  currency: z.string(),
  amount: z.string(),
  expiresAt: z.iso.datetime({ offset: true }),
  quoteVersion: z.string(),
});

export interface IStoredProposal extends z.infer<typeof proposalSchema> {}

export class Service {
  constructor(private readonly subject: SubjectService) {}

  private get ecommerce() {
    return this.subject.modules.ecommerce;
  }

  private async offer(task: Task, offerId: string) {
    const offer = await this.ecommerce.storesToProducts.findById({
      id: offerId,
    });
    if (offer?.storeId !== task.storeId) {
      return null;
    }
    const product = await this.ecommerce.product.findById({
      id: offer.productId,
    });
    if (
      !product ||
      !selectRetailOffer({
        offerId,
        offers: [offer],
        product,
        storeId: task.storeId,
      })
    ) {
      return null;
    }
    return {
      offer,
      product,
      title: product.title?.en ?? product.title?.ru ?? product.adminTitle,
    };
  }

  async offers(
    task: Task,
    stage: IFunnelStage,
  ): Promise<ICustomerWorkCartOffer[]> {
    const result: ICustomerWorkCartOffer[] = [];
    for (const offerId of stage.cartOfferIds ?? []) {
      const scope = await this.offer(task, offerId);
      if (!scope) {
        continue;
      }
      const quotes = await this.ecommerce.storesToProducts.quoteCurrencies({
        offerId,
        quantity: 1,
        currencyId: "",
      });
      const prices: ICustomerWorkCartOffer["prices"] = [];
      for (const { quote, currency } of quotes) {
        if (quote.amount !== null && !quote.issues.length) {
          prices.push({
            currencyId: currency.id,
            currency: currency.title ?? currency.slug,
            unitAmount: quote.amount,
          });
        }
      }
      if (prices.length) {
        result.push({
          offerId,
          productId: scope.product.id,
          title: scope.title,
          prices,
        });
      }
    }
    return result;
  }

  async propose(
    input: ICustomerWorkRun & {
      attemptId: string;
      selection: ICustomerWorkCartSelection;
    },
    task: Task,
    stage: IFunnelStage,
  ) {
    const selection = customerWorkCartSelectionSchema.parse(input.selection);
    if (!stage.cartOfferIds?.includes(selection.offerId)) {
      throw new Error(
        "Permission error. This offer is unavailable for the current stage",
      );
    }
    const scope = await this.offer(task, selection.offerId);
    if (!scope) {
      throw new Error(
        "Not Found error. The suggested offer is unavailable in this store",
      );
    }
    const quote = await this.ecommerce.storesToProducts.quote(selection);
    if (
      quote.storeId !== task.storeId ||
      quote.productId !== scope.product.id ||
      quote.currencyId !== selection.currencyId ||
      quote.issues.length ||
      quote.amount === null
    ) {
      throw new Error("Conflict error. The suggested offer cannot be quoted");
    }
    const currency = await this.subject.modules.billing.currency.findById({
      id: selection.currencyId,
    });
    if (!currency) {
      throw new Error("Not Found error. The suggested currency is unavailable");
    }
    return {
      ...selection,
      id: input.attemptId,
      storeId: task.storeId,
      taskId: task.id,
      productId: scope.product.id,
      eventId: input.eventId,
      publicationId: task.publicationId,
      stageId: stage.id,
      assigneeId: input.assigneeId,
      assignmentRevision: input.assignmentRevision,
      title: scope.title,
      currency: currency.title ?? currency.slug,
      amount: quote.amount,
      expiresAt: quote.expiresAt,
      quoteVersion: quote.version,
    } satisfies IStoredProposal;
  }

  read(value: unknown) {
    const parsed = proposalSchema.safeParse(value);
    return parsed.success ? parsed.data : undefined;
  }

  active(task: Task, proposal: IStoredProposal) {
    return (
      task.status === "active" &&
      task.storeId === proposal.storeId &&
      task.id === proposal.taskId &&
      task.publicationId === proposal.publicationId &&
      task.stageId === proposal.stageId &&
      task.assigneeId === proposal.assigneeId &&
      task.assignmentRevision === proposal.assignmentRevision &&
      (!task.assignmentExpiresAt || task.assignmentExpiresAt > new Date()) &&
      Date.parse(proposal.expiresAt) > Date.now()
    );
  }

  async verify(task: Task, stage: IFunnelStage, proposal: IStoredProposal) {
    if (
      !this.active(task, proposal) ||
      !stage.cartOfferIds?.includes(proposal.offerId)
    ) {
      throw new Error("Conflict error. This cart suggestion has expired");
    }
    const scope = await this.offer(task, proposal.offerId);
    const { offerId, currencyId, quantity } = proposal;
    const quote = await this.ecommerce.storesToProducts.quote({
      offerId,
      currencyId,
      quantity,
    });
    if (
      !scope ||
      scope.product.id !== proposal.productId ||
      quote.storeId !== task.storeId ||
      quote.currencyId !== currencyId ||
      quote.version !== proposal.quoteVersion ||
      quote.amount !== proposal.amount ||
      quote.issues.length
    ) {
      throw new Error(
        "Conflict error. The offer changed. Ask for an updated suggestion",
      );
    }
    return scope;
  }

  summary(
    proposal: IStoredProposal,
    orderId?: string,
  ): ICustomerWorkCartProposal {
    return {
      id: proposal.id,
      offerId: proposal.offerId,
      currencyId: proposal.currencyId,
      quantity: proposal.quantity,
      title: proposal.title,
      currency: proposal.currency,
      amount: proposal.amount,
      expiresAt: proposal.expiresAt,
      orderId,
    };
  }
}
