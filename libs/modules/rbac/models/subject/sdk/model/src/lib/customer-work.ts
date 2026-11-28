import type { IModel as IEcommerceModuleProduct } from "@sps/ecommerce/models/product/sdk/model";
import type { IModel as ICrmTask } from "@sps/crm/models/task/sdk/model";
import type { IModel as ISocialModuleThread } from "@sps/social/models/thread/sdk/model";
import { z } from "zod";
import { ecommerceOrderCreateSchema } from "./ecommerce-product-purchase";
import type {
  TCoverAttachmentRole,
  TStageWorkCapability,
} from "@sps/crm/models/funnel/sdk/model";
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
  scopeSchema
    .extend({
      operation: z.literal("chat-checkout"),
      taskId: z.uuid(),
      input: z.discriminatedUnion("kind", [
        z.object({ kind: z.literal("begin") }).strict(),
        z
          .object({
            kind: z.literal("button"),
            messageId: z.uuid(),
            value: z.string().min(1).max(64),
          })
          .strict(),
      ]),
    })
    .strict(),
  offerScopeSchema.extend({ operation: z.literal("ask") }).strict(),
  scopeSchema
    .extend({
      operation: z.literal("enter-order-discussion"),
      orderId: z.uuid(),
      taskId: z.uuid(),
    })
    .strict(),
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
      messageId: z.uuid().optional(),
      maximum: z
        .string()
        .regex(/^(?:0|[1-9][0-9]{0,17})(?:\.[0-9]{1,12})?$/)
        .refine((value) => /[1-9]/.test(value))
        .optional(),
      priceKey: z.string().regex(/^[a-f0-9]{64}$/),
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
  workMetered?: boolean;
  workTokenTariff?: ICustomerWorkTokenTariff;
}

export interface ICustomerWorkTokenRate {
  capability: TStageWorkCapability;
  model: string;
  input: string;
  cachedInput?: string;
  cacheWrite?: string;
  output?: string;
}

export interface ICustomerWorkTokenTariff {
  /** Amounts in SPS wallet tokens per model token. */
  rates: ICustomerWorkTokenRate[];
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

const customerWorkRateCallbackPrefix = "work-rate:";
export const customerWorkTelegramRatePath = "/telegram/customer-work-rate";
const customerWorkRatePromptSchema = z.object({
  taskId: z.uuid(),
  priceKey: z.string().regex(/^[a-f0-9]{64}$/),
  maximum: z.string().optional(),
});

export function customerWorkRateCallback(messageId: string) {
  return `${customerWorkRateCallbackPrefix}${messageId}`;
}

export function isCustomerWorkRateCallback(value: string) {
  return value.startsWith(customerWorkRateCallbackPrefix);
}

export function customerWorkRateCallbackMessageId(value: string) {
  if (!isCustomerWorkRateCallback(value)) {
    return;
  }
  return z.uuid().safeParse(value.slice(customerWorkRateCallbackPrefix.length))
    .data;
}

export const customerWorkTelegramRateSchema = z
  .object({
    callbackData: z.string().max(64),
    fromId: z.int().positive(),
    chatId: z.int().positive(),
    chatType: z.literal("private"),
    telegramMessageId: z.int().positive(),
  })
  .strict()
  .refine(({ fromId, chatId }) => fromId === chatId, { path: ["fromId"] })
  .transform(({ callbackData, chatId, telegramMessageId }, context) => {
    const messageId = customerWorkRateCallbackMessageId(callbackData);
    if (!messageId) {
      context.addIssue({
        code: "custom",
        path: ["callbackData"],
        message: "Invalid work rate message",
      });
      return z.NEVER;
    }
    return {
      messageId,
      telegramChatId: String(chatId),
      telegramMessageId: String(telegramMessageId),
    };
  });
export interface ICustomerWorkTelegramRateRequest extends z.input<
  typeof customerWorkTelegramRateSchema
> {}

export function customerWorkRatePromptKey(
  taskId: string,
  assignmentRevision: number,
  priceKey: string,
) {
  return `customer-work-rate:${taskId}:${assignmentRevision}:${priceKey}`;
}

export function readCustomerWorkRatePrompt(message: {
  id: string;
  variant: string;
  workReplyKey?: string | null;
  metadata?: Record<string, unknown> | null;
  interaction?: unknown;
}) {
  if (message.variant !== "customer-work") return;
  const prompt = customerWorkRatePromptSchema.safeParse(
    message.metadata?.customerWorkRatePrompt,
  ).data;
  if (
    !prompt ||
    !message.workReplyKey?.startsWith(`customer-work-rate:${prompt.taskId}:`)
  )
    return;
  const keyboard = z
    .object({
      inline_keyboard: z.tuple([
        z.tuple([
          z.object({ text: z.string().min(1), callback_data: z.string() }),
        ]),
      ]),
    })
    .safeParse(message.interaction).data;
  const button = keyboard?.inline_keyboard[0][0];
  if (button?.callback_data !== customerWorkRateCallback(message.id)) return;
  return { ...prompt, button };
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
  checkoutUrl?: string;
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
  canRequestManager: boolean;
  awaitingManager?: boolean;
  workflow?: {
    title: string;
    stageId?: string;
    stageTitle: string;
    checkoutPromptId?: string;
    orderStep?:
      "review" | "ecommerce-module-order-payment" | "order-file-delivery";
  };
  assignment: "assistant" | "manager" | "unassigned";
  status: "active" | "waiting" | "closed";
  discussionOnly?: boolean;
  storeTest?: { storeSlug: string; funnelId: string; funnelSlug: string };
  customerPays: boolean;
  requiredMaximum?: string;
  rateApproved?: boolean;
  canApproveRate?: boolean;
  ratePromptMessageId?: string;
  fundingCurrency?: string;
  price?: ICustomerWorkPrice;
  approvedMaximum?: string;
  memory?: ICustomerWorkMemory;
  cartProposal?: ICustomerWorkCartProposal;
  messages: ICustomerWorkMessage[];
}

export function isStoreTest(openingKey?: string | null) {
  return openingKey?.startsWith("store-test:") === true;
}

export function canDiscussCompletedOrder(
  task: Pick<ICrmTask, "status" | "outcome" | "orderId">,
) {
  return (
    task.status === "closed" && task.outcome === "completed" && !!task.orderId
  );
}

export interface IPendingCustomerWork {
  storeId: string;
  taskId: string;
  eventId: string;
  assigneeId: string;
  assignmentRevision: number;
  capability: "text";
  purpose?: "stage-check";
}

export interface ICustomerWorkRun extends Omit<
  IPendingCustomerWork,
  "capability"
> {}

export interface ICustomerWorkSourceVersion {
  id: string;
  version: string;
  orderResultPath?: string;
}

export interface ICustomerWorkRunAttachment {
  messageId: string;
  id: string;
  name: string;
  digest: string;
  mimeType: string;
  coverRole?: TCoverAttachmentRole;
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
  releaseOrderFile?: { paymentId: string; fileId: string };
  orderResultFileId?: string;
  workDocumentId?: string;
  attemptId: string;
  text: string;
  sourceVersions?: ICustomerWorkSourceVersion[];
  cartSelection?: ICustomerWorkCartSelection;
  imageDraftDigest?: string | null;
  coverGenerationDigest?: string;
}
