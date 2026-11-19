import type { IModel as IEcommerceModuleProduct } from "@sps/ecommerce/models/product/sdk/model";
import type { IModel as ISocialModuleThread } from "@sps/social/models/thread/sdk/model";
import { z } from "zod";
import { ecommerceOrderCreateSchema } from "./ecommerce-product-purchase";
import type { TStageWorkCapability } from "@sps/crm/models/funnel/sdk/model";
import type { IProviderTerms, IProviderType } from "./provider-connections";
import { ECOMMERCE_ORDER_LINE_QUANTITY_BOUNDS } from "@sps/shared-utils";

export const customerWorkCartSelectionSchema = z
  .object({
    offerId: z.uuid(),
    currencyId: z.uuid(),
    quantity: z
      .number()
      .int()
      .min(ECOMMERCE_ORDER_LINE_QUANTITY_BOUNDS.min)
      .max(ECOMMERCE_ORDER_LINE_QUANTITY_BOUNDS.max),
  })
  .strict();

const scopeSchema = z.object({
  storeId: z.uuid(),
  operationKey: z.uuid(),
});
const offerScopeSchema = scopeSchema.extend({
  productId: z.uuid(),
  offerId: z.uuid(),
});

export const customerWorkCommandSchema = z.discriminatedUnion("operation", [
  offerScopeSchema.extend({ operation: z.literal("ask") }).strict(),
  offerScopeSchema
    .extend({
      operation: z.literal("open-cart-discussion"),
      orderId: z.uuid(),
    })
    .strict(),
  offerScopeSchema
    .extend({
      operation: z.literal("add"),
      consultationTaskId: z.uuid().optional(),
      selection: ecommerceOrderCreateSchema
        .omit({
          productId: true,
          storeId: true,
          offerId: true,
        })
        .strict(),
    })
    .strict(),
  scopeSchema
    .extend({
      operation: z.literal("confirm-cart"),
      taskId: z.uuid(),
      proposalId: z.uuid(),
    })
    .strict(),
  scopeSchema
    .extend({
      operation: z.literal("message"),
      taskId: z.uuid(),
      text: z.string().trim().min(1).max(8000),
    })
    .strict(),
  scopeSchema
    .extend({
      operation: z.literal("handoff"),
      taskId: z.uuid(),
    })
    .strict(),
  scopeSchema
    .extend({
      operation: z.literal("approve-budget"),
      taskId: z.uuid(),
      maximum: z
        .string()
        .regex(/^(?:0|[1-9][0-9]{0,17})(?:\.[0-9]{1,12})?$/)
        .refine((value) => /[1-9]/.test(value)),
      priceKey: z.string().regex(/^[a-f0-9]{64}$/),
    })
    .strict(),
  scopeSchema
    .extend({
      operation: z.literal("memory-project"),
      taskId: z.uuid(),
      projectId: z.uuid().nullable(),
    })
    .strict(),
  scopeSchema
    .extend({
      operation: z.literal("remember"),
      taskId: z.uuid(),
      sourceId: z.uuid().optional(),
      text: z.string().trim().min(1).max(2000),
    })
    .strict(),
  scopeSchema
    .extend({
      operation: z.literal("forget"),
      taskId: z.uuid(),
      sourceId: z.uuid(),
    })
    .strict(),
]);

export const customerWorkScopeSchema = z.object({
  storeId: z.uuid(),
  taskId: z.uuid(),
});
export const customerWorkOfferScopeSchema = customerWorkScopeSchema
  .pick({ storeId: true })
  .extend({
    offerId: z.uuid(),
    productId: z.uuid(),
  });

export type TCustomerWorkCommand = z.infer<typeof customerWorkCommandSchema>;
export interface ICustomerWorkScope extends z.infer<
  typeof customerWorkScopeSchema
> {}
export interface ICustomerWorkOfferScope extends z.infer<
  typeof customerWorkOfferScopeSchema
> {}
export interface ICustomerWorkOfferAvailability {
  consultation: boolean;
  order: boolean;
  payAfterAcceptance: boolean;
}

export interface ICustomerWorkMessage {
  id: string;
  author: string;
  kind: "customer" | "operator";
  body: string;
}

export interface ICustomerWorkMemoryNote {
  id: string;
  text: string;
}

export interface ICustomerWorkMemory {
  currentProjectId?: string;
  projects: { id: string; title: string }[];
  notes: ICustomerWorkMemoryNote[];
}

export interface ICustomerWorkRate extends IProviderTerms {
  capability: TStageWorkCapability;
  provider: IProviderType;
  model: string;
}

export interface ICustomerWorkPrice {
  key: string;
  rates: ICustomerWorkRate[];
}

export interface ICustomerWorkCartSelection extends z.infer<
  typeof customerWorkCartSelectionSchema
> {}

export interface ICustomerWorkCartOffer {
  offerId: string;
  productId: string;
  title: string;
  prices: { currencyId: string; currency: string; unitAmount: string }[];
}

export interface ICustomerWorkCartProposal extends ICustomerWorkCartSelection {
  id: string;
  title: string;
  currency: string;
  amount: string;
  expiresAt: string;
  orderId?: string;
}

export interface ILinkedChatProduct extends Pick<
  IEcommerceModuleProduct,
  "id" | "slug" | "title"
> {}

export interface ISocialModuleChatThread extends ISocialModuleThread {
  hasCustomerWork?: boolean;
  linkedProducts?: ILinkedChatProduct[];
}

export interface ICustomerWorkOrderSummary {
  product: Pick<
    IEcommerceModuleProduct,
    "id" | "slug" | "title" | "shortDescription" | "type"
  >;
  quantity: number;
  offerId?: string;
  total?: { amount: number; symbol: string; precision: number };
}

export interface ICustomerWorkView {
  storeId: string;
  taskId: string;
  chatId: string;
  threadId: string;
  orderId?: string;
  orderSummary?: ICustomerWorkOrderSummary;
  offerId?: string;
  productSlug?: string;
  productTitle?: IEcommerceModuleProduct["title"];
  consultationTaskId?: string;
  operator?: string;
  workflow?: { title: string; stageTitle: string };
  assignment: "assistant" | "manager" | "unassigned";
  status: "active" | "waiting" | "closed";
  customerPays: boolean;
  requiredMaximum?: string;
  fundingCurrency?: string;
  price?: ICustomerWorkPrice;
  approvedMaximum?: string;
  memory?: ICustomerWorkMemory;
  cartProposal?: ICustomerWorkCartProposal;
  messages: ICustomerWorkMessage[];
}

export interface IPendingCustomerWork {
  storeId: string;
  taskId: string;
  eventId: string;
  assigneeId: string;
  assignmentRevision: number;
  capability: "text";
}

export interface ICustomerWorkRun extends Omit<
  IPendingCustomerWork,
  "capability"
> {}

export interface ICustomerWorkSourceVersion {
  id: string;
  version: string;
}

export interface ICustomerWorkRunAttachment {
  messageId: string;
  id: string;
  name: string;
  digest: string;
  mimeType: string;
}

export function customerWorkAttachmentPath(
  subjectId: string,
  threadId: string,
  messageId: string,
  attachmentId: string,
) {
  return `/api/rbac/subjects/${encodeURIComponent(subjectId)}/customer-work/threads/${encodeURIComponent(threadId)}/messages/${encodeURIComponent(messageId)}/attachments/${encodeURIComponent(attachmentId)}`;
}

export interface ICustomerWorkReply extends ICustomerWorkRun {
  resultVersionId?: string;
  attemptId: string;
  text: string;
  sourceVersions?: ICustomerWorkSourceVersion[];
  cartSelection?: ICustomerWorkCartSelection;
  imageDraftDigest?: string | null;
}
