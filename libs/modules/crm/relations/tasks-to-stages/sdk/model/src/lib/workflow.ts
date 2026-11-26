import type { TTaskEvidence } from "@sps/crm/models/task/sdk/model";
import type { TCoverAttachmentRole } from "@sps/crm/models/funnel/sdk/model";

export type TTaskStageState =
  "pending" | "required" | "current" | "completed" | "closed";

export type TTaskEventKind =
  | "stage-state"
  | "opened"
  | "assigned"
  | "assignment-released"
  | "transitioned"
  | "evidence-recorded"
  | "customer-message"
  | "staff-message"
  | "stage-entry"
  | "stage-check"
  | "customer-work-resumed"
  | "customer-handoff-requested"
  | "customer-transferred"
  | "customer-budget-approved"
  | "customer-cart-approved"
  | "migrated"
  | "offer-attached"
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
  assignmentMode?: "stage";
  actionId?: string;
  productId?: string;
  offerId?: string;
  orderId?: string;
  formId?: string;
  messageId?: string;
  preparationFailures?: number;
  replyActionId?: string;
  coverAttachmentRole?: TCoverAttachmentRole;
  sourceRevision?: number;
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
