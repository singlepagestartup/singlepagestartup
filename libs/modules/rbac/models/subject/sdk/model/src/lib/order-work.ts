import { z } from "zod";
import { deliveredOrderWorkFile } from "@sps/ecommerce/models/order/sdk/model";
import type {
  IOrderWork,
  IOrderWorkExpertArchive,
  TWorkFulfillmentState,
} from "@sps/ecommerce/models/order/sdk/model";

export const customerWorkTelegramFileReviewPath =
  "/telegram/customer-work-file-review";

export function isOrderFileReviewCallback(value: string) {
  return (
    value.startsWith("order:accept:") || value.startsWith("order:decline:")
  );
}

export const customerWorkTelegramFileReviewSchema = z
  .object({
    callbackData: z.string().max(64),
    fromId: z.int().positive(),
    chatId: z.int().positive(),
    chatType: z.literal("private"),
    telegramMessageId: z.int().positive(),
  })
  .strict()
  .transform((input, context) => {
    const [namespace, action, id, extra] = input.callbackData.split(":");
    const fileId = z.uuid().safeParse(id).data;
    if (
      input.fromId !== input.chatId ||
      namespace !== "order" ||
      (action !== "accept" && action !== "decline") ||
      !fileId ||
      extra !== undefined
    ) {
      context.addIssue({
        code: "custom",
        message: "Invalid Telegram result review callback",
      });
      return z.NEVER;
    }
    return {
      operation:
        action === "accept"
          ? ("accept" as const)
          : ("request-changes" as const),
      fileId,
      telegramChatId: String(input.chatId),
      telegramMessageId: String(input.telegramMessageId),
    };
  });

export interface ICustomerWorkTelegramFileReviewRequest extends z.input<
  typeof customerWorkTelegramFileReviewSchema
> {}

export function orderFileReviewInteraction(fileId: string, russian: boolean) {
  return {
    inline_keyboard: [
      [
        {
          text: russian ? "Принять файл" : "Accept file",
          callback_data: `order:accept:${fileId}`,
        },
        {
          text: russian ? "Запросить правки" : "Request changes",
          callback_data: `order:decline:${fileId}`,
        },
      ],
    ],
  };
}

const callbackButton = z.object({
  text: z.string().min(1),
  callback_data: z.string(),
});
export const orderCheckoutProviders = [
  "stripe",
  "0xprocessing",
  "payselection",
  "payselection-international",
  "tiptoppay",
  "cloudpayments",
  "dummy",
  "paykeeper",
] as const;

const telegramOrderCheckoutPrefix = "order-checkout:";
const orderCheckoutCallbackValues = [
  "back",
  "skip",
  "pay",
  ...orderCheckoutProviders.map((provider) => `method:${provider}`),
];

export const customerWorkTelegramCheckoutPath =
  "/telegram/customer-work-checkout";

export function isOrderCheckoutTelegramCallback(value: string) {
  return value.startsWith(telegramOrderCheckoutPrefix);
}

export const customerWorkTelegramCheckoutSchema = z
  .object({
    callbackData: z.string().max(64),
    fromId: z.int().positive(),
    chatId: z.int().positive(),
    chatType: z.literal("private"),
    telegramMessageId: z.int().positive(),
  })
  .strict()
  .transform((input, context) => {
    const value = input.callbackData.slice(telegramOrderCheckoutPrefix.length);
    if (
      input.fromId !== input.chatId ||
      !isOrderCheckoutTelegramCallback(input.callbackData) ||
      !orderCheckoutCallbackValues.includes(value)
    ) {
      context.addIssue({
        code: "custom",
        message: "Invalid Telegram checkout callback",
      });
      return z.NEVER;
    }
    return {
      value,
      telegramChatId: String(input.chatId),
      telegramMessageId: String(input.telegramMessageId),
    };
  });

export interface ICustomerWorkTelegramCheckoutRequest extends z.input<
  typeof customerWorkTelegramCheckoutSchema
> {}

const paymentProviderNames: Readonly<Record<string, string>> = {
  stripe: "Stripe",
  "0xprocessing": "0xProcessing",
  payselection: "PaySelection",
  "payselection-international": "PaySelection International",
  tiptoppay: "TipTopPay",
  cloudpayments: "CloudPayments",
  paykeeper: "PayKeeper",
  "telegram-star": "Telegram Stars",
};

export function orderPaymentProviderLabel(provider: string, language: string) {
  if (provider === "dummy") {
    return language === "ru" ? "Тестовая оплата" : "Test payment";
  }
  return Object.hasOwn(paymentProviderNames, provider)
    ? paymentProviderNames[provider]
    : provider;
}

const checkoutKeyboard = z.object({
  inline_keyboard: z.array(
    z.array(
      z.union([
        callbackButton,
        z.object({ text: z.string().min(1), url: z.httpUrl() }),
      ]),
    ),
  ),
});

interface IOrderCheckoutMessage {
  id: string;
  variant: string;
  workReplyKey?: string | null;
  interaction?: unknown;
}

export function readOrderCheckoutButtons(message: IOrderCheckoutMessage) {
  if (
    message.variant !== "customer-work" ||
    message.workReplyKey !== `order-checkout:${message.id}`
  )
    return;
  return checkoutKeyboard.safeParse(message.interaction).data?.inline_keyboard;
}

export function orderCheckoutTelegramInteraction(
  message: IOrderCheckoutMessage,
) {
  const rows = readOrderCheckoutButtons(message);
  if (!rows) {
    return;
  }
  return {
    inline_keyboard: rows
      .map((row) =>
        row
          .filter(
            (button) =>
              !("callback_data" in button) ||
              orderCheckoutCallbackValues.includes(button.callback_data),
          )
          .map((button) => {
            if ("callback_data" in button) {
              return {
                ...button,
                callback_data: `${telegramOrderCheckoutPrefix}${button.callback_data}`,
              };
            }
            return button;
          }),
      )
      .filter((row) => row.length > 0),
  };
}

const fileReviewKeyboard = z.object({
  inline_keyboard: z.tuple([z.tuple([callbackButton, callbackButton])]),
});

export interface IOrderFileReview {
  fileId: string;
  acceptText: string;
  declineText: string;
}

export function readOrderFileReview(message: {
  variant: string;
  workReplyKey?: string | null;
  metadata?: Record<string, unknown> | null;
  interaction?: unknown;
}): IOrderFileReview | undefined {
  if (message.variant !== "customer-work" || !message.workReplyKey) return;
  const fileId = z.uuid().safeParse(message.metadata?.orderResultFileId).data;
  const row = fileReviewKeyboard.safeParse(message.interaction).data
    ?.inline_keyboard[0];
  if (!fileId || !row) return;
  const [accept, decline] = row;
  if (
    accept.callback_data !== `order:accept:${fileId}` ||
    decline.callback_data !== `order:decline:${fileId}`
  ) {
    return undefined;
  }
  return { fileId, acceptText: accept.text, declineText: decline.text };
}

const paymentNoticeSchema = z.object({
  eventId: z.uuid(),
  orderId: z.uuid(),
  invoiceId: z.uuid(),
  paymentIntentId: z.uuid(),
  amount: z.string(),
  currency: z.string(),
});
export function orderPaymentMessageKey(eventId: string) {
  return `order-payment:${eventId}`;
}
export function readOrderPaymentNotice(message: {
  variant: string;
  workReplyKey?: string | null;
  metadata?: Record<string, unknown> | null;
}) {
  const notice = paymentNoticeSchema.safeParse(
    message.metadata?.orderPayment,
  ).data;
  if (
    notice &&
    message.variant === "customer-work" &&
    message.workReplyKey === orderPaymentMessageKey(notice.eventId)
  ) {
    return notice;
  }
  return undefined;
}
export const orderWorkScopeSchema = z.object({
  storeId: z.uuid(),
  taskId: z.uuid(),
});

export const orderWorkFulfillmentSchema = orderWorkScopeSchema
  .extend({
    stage: z.enum(["preparing", "in-transit", "delivered"]),
    operationKey: z.string().trim().min(1).max(140),
    trackingNumber: z.string().trim().min(1).max(180).optional(),
    carrierEvidenceId: z.string().trim().min(1).max(180).optional(),
  })
  .strict();

const decisionSchema = orderWorkScopeSchema.extend({
  fileId: z.uuid(),
  operationKey: z.string().trim().min(1).max(140),
});

export const orderWorkDecisionSchema = z.discriminatedUnion("operation", [
  decisionSchema.extend({ operation: z.literal("accept") }).strict(),
  decisionSchema
    .extend({
      operation: z.literal("request-changes"),
      messageId: z.uuid().optional(),
    })
    .strict(),
  decisionSchema
    .extend({
      operation: z.literal("decline"),
      reason: z.string().trim().min(1).max(4000),
    })
    .strict(),
]);

export function orderFileFeedbackOperationKey(
  fileId: string,
  operationKey: string,
) {
  return `file-feedback:${fileId}:${operationKey}`;
}

export function orderFileRevisionPromptKey(taskId: string, fileId: string) {
  return `order-revision:${taskId}:${fileId}`;
}

export type TOrderWorkDecision = z.infer<typeof orderWorkDecisionSchema>;
export interface IOrderWorkScope extends z.infer<typeof orderWorkScopeSchema> {}

export interface IOrderArtifact {
  id: string;
  path: string;
  name?: string;
  mimeType?: string;
}

export interface IOrderArtifactKnowledge {
  profileId: string;
  sourceId: string | null;
}

export interface IOrderResultFile {
  name?: string;
  id: string;
  legacyMessageId?: string;
  changesRequested?: boolean;
  createdAt: string;
  price: string;
  includedInWork?: boolean;
  currencyId: string;
  preview: IOrderArtifact;
  previewMimeType?: string;
  invalidatedByCartEdit?: true;
}

export interface IOrderWorkView {
  orderId: string;
  taskId: string;
  storeId: string;
  state: TWorkFulfillmentState;
  acceptedFileId: string | null;
  paidFileId: string | null;
  includedInWork?: boolean;
  files: IOrderResultFile[];
  result: IOrderArtifact | null;
  receipt: IOrderArtifact | null;
  deliveryStatus: "pending" | "available";
  trackingNumber: string | null;
  expertArchive?: IOrderWorkExpertArchive;
}

export function orderResultFiles(
  work: IOrderWork,
  descriptor: (id: string) => IOrderArtifact,
) {
  const original = deliveredOrderWorkFile(work);
  const includedInWork = work.paymentMode === "work-tokens" || undefined;
  const files = work.files.map((file) => ({
    id: file.previewFileId,
    name: file.previewName,
    legacyMessageId: file.legacyMessageId,
    createdAt: file.createdAt,
    price: file.price,
    includedInWork,
    currencyId: file.currencyId,
    preview: descriptor(file.previewFileId),
    previewMimeType: file.previewMimeType,
    invalidatedByCartEdit: file.invalidatedByCartEdit,
    changesRequested: work.decisions.some(
      (decision) => decision.fileId === file.id && decision.kind === "declined",
    ),
  }));
  return {
    files,
    result: original
      ? {
          ...descriptor(original.originalFileId),
          name: original?.originalName,
          mimeType: original?.originalMimeType,
        }
      : null,
    acceptedFileId: work.acceptedFileId,
    paidFileId: work.paid?.fileId ?? null,
    includedInWork,
  };
}

export function orderWorkPath(subjectId: string, orderId: string) {
  return `/api/rbac/subjects/${subjectId}/ecommerce-module/orders/${orderId}/work`;
}

export function orderArtifactPath(
  subjectId: string,
  orderId: string,
  fileId: string,
) {
  return `${orderWorkPath(subjectId, orderId)}/artifacts/${fileId}`;
}

export function orderArtifactKnowledgePath(
  subjectId: string,
  orderId: string,
  fileId: string,
) {
  return `${orderArtifactPath(subjectId, orderId, fileId)}/knowledge`;
}

export function orderResultKnowledgeOrigin(slug: string) {
  const match = slug.match(
    /^personal-profile-([0-9a-f-]{36})-order-([0-9a-f-]{36})-result-([0-9a-f-]{36})$/i,
  );
  if (!match) {
    return undefined;
  }
  const [, profileId, orderId, versionId] = match;
  if (
    !z
      .tuple([z.uuid(), z.uuid(), z.uuid()])
      .safeParse([profileId, orderId, versionId]).success
  ) {
    return undefined;
  }
  return {
    profileId,
    path: `/rbac/subjects/orders/${orderId}#result-${versionId}`,
  };
}
