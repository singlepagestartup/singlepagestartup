import type { TTaskEvidence } from "@sps/crm/models/task/sdk/model";

export type TTaskEventKind =
  | "opened"
  | "assigned"
  | "transitioned"
  | "evidence-recorded"
  | "customer-message"
  | "customer-handoff-requested"
  | "customer-transferred"
  | "customer-budget-approved"
  | "customer-cart-approved"
  | "migrated"
  | "order-attached"
  | "closed"
  | "reminder-due"
  | "deadline-reached";

export interface ITaskEventDetail {
  previousStageId?: string;
  stageId?: string;
  previousPublicationId?: string;
  publicationId?: string;
  assigneeId?: string;
  assignmentRevision?: number;
  actionId?: string;
  orderId?: string;
  formId?: string;
  messageId?: string;
  customerId?: string;
  previousCustomerId?: string;
  approvedMaximum?: string;
  budgetCurrencyId?: string;
  budgetPriceKey?: string;
  budgetRates?: Record<string, string | number>[];
  cartSelection?: {
    proposalId: string;
    offerId: string;
    currencyId: string;
    quantity: number;
    amount: string;
    quoteVersion: string;
  };
  reason?: string;
  timerNumber?: number;
  waitingRevision?: number;
  evidence?: TTaskEvidence;
}
