import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  NEXT_PUBLIC_TELEGRAM_SERVICE_URL,
  RBAC_JWT_SECRET,
  RBAC_JWT_TOKEN_LIFETIME_IN_SECONDS,
  RBAC_SECRET_KEY,
  TELEGRAM_SERVICE_BOT_TOKEN,
  TELEGRAM_SERVICE_BOT_USERNAME,
  TELEGRAM_SERVICE_REQUIRED_SUBSCRIPTION_CHANNEL_ID,
} from "@sps/shared-utils";
import {
  Bot as GrammyBot,
  webhookCallback,
  Context as GrammyContext,
} from "grammy";
import { IModel as IRbacSubject } from "@sps/rbac/models/subject/sdk/model";
import { api as rbacModuleSubjectApi } from "@sps/rbac/models/subject/sdk/server";
import { api as agentModuleAgentApi } from "@sps/agent/models/agent/sdk/server";
import { IModel as ISocialModuleChat } from "@sps/social/models/chat/sdk/model";
import { IModel as ISocialModuleProfile } from "@sps/social/models/profile/sdk/model";
import { IModel as ISocialModuleThread } from "@sps/social/models/thread/sdk/model";
import { api as billingModulePaymentIntentApi } from "@sps/billing/models/payment-intent/sdk/server";
import { api as billingModuleInvoiceApi } from "@sps/billing/models/invoice/sdk/server";
import { IModel as IBillingModuleInvoice } from "@sps/billing/models/invoice/sdk/model";
import { api as billingModulePaymentIntentsToInvoicesApi } from "@sps/billing/relations/payment-intents-to-invoices/sdk/server";
import { api as ecommerceModuleOrdersToBillingModulePaymentIntentsApi } from "@sps/ecommerce/relations/orders-to-billing-module-payment-intents/sdk/server";
import { api as ecommerceModuleOrderApi } from "@sps/ecommerce/models/order/sdk/server";
import { blobifyFiles } from "@sps/backend-utils";
import * as jwt from "hono/jwt";
import {
  extractTelegramAudioMessageData,
  extractTelegramVoiceMessageData,
  type TelegramVoiceMessageData,
} from "./telegram-voice-message";

export type TelegramBotContext = GrammyContext;

type TelegramAttachmentCandidate = {
  fileId: string;
  fileName?: string;
  title?: string;
  mimeType?: string;
};

const TELEGRAM_AUDIO_EXTENSIONS = [
  "aac",
  "flac",
  "m4a",
  "mp3",
  "oga",
  "ogg",
  "opus",
  "wav",
  "webm",
];

function splitFileName(value: string) {
  const cleanValue = value.split("?")[0];
  const baseName = cleanValue.split("/").pop() || cleanValue;
  const dotIndex = baseName.lastIndexOf(".");

  if (dotIndex > 0) {
    return {
      title: baseName.slice(0, dotIndex),
      extension: baseName.slice(dotIndex + 1),
    };
  }

  return { title: baseName, extension: "" };
}

function sanitizeFileTitle(value: string) {
  const trimmed = value.trim();
  const safe = trimmed
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return safe || "telegram-audio";
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

interface INormalizeTelegramTransportControlsProps {
  botUsername: string;
  description: string;
}

interface IIsTelegramMessageAddressedToBotProps {
  botUsername: string;
  description?: string;
  isReplyToBot?: boolean;
}

interface ITelegramBackgroundErrorMetadata {
  errorId: string;
  errorType: string;
  status?: number;
}

type ITelegramStarCheckoutValidation =
  | {
      ok: true;
      invoice: IBillingModuleInvoice;
      idempotent: boolean;
    }
  | {
      ok: false;
      code:
        | "currency"
        | "invoice"
        | "provider"
        | "amount"
        | "status"
        | "payment-intent"
        | "order";
    };

function asErrorRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : undefined;
}

function parseErrorMessage(
  value: unknown,
): Record<string, unknown> | undefined {
  if (!(value instanceof Error)) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(value.message);
    return asErrorRecord(parsed);
  } catch {
    return undefined;
  }
}

function sanitizeErrorIdentifier(value: unknown) {
  if (typeof value !== "string") {
    return undefined;
  }

  const identifier = value.trim();

  if (
    !identifier ||
    identifier === "unknown" ||
    !/^[a-zA-Z0-9._:-]{1,128}$/.test(identifier)
  ) {
    return undefined;
  }

  return identifier;
}

function getTelegramBackgroundErrorMetadata(
  error: unknown,
): ITelegramBackgroundErrorMetadata {
  const errorRecord = asErrorRecord(error);
  const causeRecord = asErrorRecord(errorRecord?.cause);
  const payloadRecord = asErrorRecord(errorRecord?.payload);
  const parsedRecord = parseErrorMessage(error);
  const candidates = [errorRecord, causeRecord, payloadRecord, parsedRecord];
  const errorId =
    candidates
      .map((candidate) =>
        sanitizeErrorIdentifier(candidate?.requestId ?? candidate?.errorId),
      )
      .find(Boolean) ?? randomUUID();
  const status = candidates
    .map((candidate) => candidate?.status)
    .find((value): value is number => typeof value === "number");
  const rawErrorType =
    candidates
      .map((candidate) => candidate?.name)
      .find((value): value is string => typeof value === "string") ??
    (error instanceof Error ? error.constructor.name : typeof error);
  const errorType =
    rawErrorType.replace(/[^a-zA-Z0-9._:-]/g, "").slice(0, 64) || "unknown";

  return {
    errorId,
    errorType,
    status,
  };
}

export function normalizeTelegramTransportControls(
  props: INormalizeTelegramTransportControlsProps,
): string {
  const botUsername = props.botUsername.trim().replace(/^@/, "");
  const escapedBotUsername = escapeRegExp(botUsername);
  let description = props.description.trim();

  if (escapedBotUsername) {
    description = description
      .replace(new RegExp(`^@${escapedBotUsername}(?=\\s|$)\\s*`, "i"), "")
      .replace(
        new RegExp(`^(\\/[a-z0-9_]+)@${escapedBotUsername}(?=\\s|$)`, "i"),
        "$1",
      )
      .trim();
  }

  return description;
}

export function isTelegramLearnCommand(description: string): boolean {
  return /^(?:@knowledge\s+)?\/learn(?=\s|$)/i.test(description.trim());
}

export function isTelegramMessageAddressedToBot(
  props: IIsTelegramMessageAddressedToBotProps,
): boolean {
  if (props.isReplyToBot) {
    return true;
  }

  const botUsername = props.botUsername.trim().replace(/^@/, "");

  if (!botUsername || !props.description) {
    return false;
  }

  const escapedBotUsername = escapeRegExp(botUsername);

  return (
    new RegExp(`^@${escapedBotUsername}(?=\\s|$)`, "i").test(
      props.description,
    ) ||
    new RegExp(`^/[a-z0-9_]+@${escapedBotUsername}(?=\\s|$)`, "i").test(
      props.description,
    )
  );
}

export function isTelegramBotAuthoredMessage(message?: {
  from?: { is_bot?: boolean };
}) {
  return message?.from?.is_bot === true;
}

const TELEGRAM_LEARN_CHUNK_DEBOUNCE_MS = 1_500;
const TELEGRAM_BOOTSTRAP_RETRY_DELAYS_MS = [
  1_000, 2_000, 5_000, 10_000, 20_000,
];

export function isTransientTelegramApiError(error: unknown) {
  const errorRecord = asErrorRecord(error);
  const parsedRecord = parseErrorMessage(error);
  const candidates = [
    errorRecord,
    asErrorRecord(errorRecord?.cause),
    asErrorRecord(errorRecord?.payload),
    parsedRecord,
  ];
  const status = candidates
    .map((candidate) => candidate?.status)
    .find((value): value is number => typeof value === "number");

  if (status && [408, 425, 429, 502, 503, 504].includes(status)) {
    return true;
  }

  const message = [
    error instanceof Error ? error.message : String(error),
    ...candidates.map((candidate) => candidate?.message),
    parsedRecord?.cause ? JSON.stringify(parsedRecord.cause) : "",
  ]
    .filter((value): value is string => typeof value === "string")
    .join(" ");

  return /unable to connect|fetch failed|connection refused|econnrefused|econnreset|etimedout|socket (?:closed|ended)|network error/i.test(
    message,
  );
}

export function isDuplicateTelegramStarPaymentError(error: unknown) {
  const errorRecord = asErrorRecord(error);
  const parsedRecord = parseErrorMessage(error);
  const message = [
    error instanceof Error ? error.message : String(error),
    errorRecord?.message,
    asErrorRecord(errorRecord?.cause)?.message,
    parsedRecord?.message,
    parsedRecord?.cause ? JSON.stringify(parsedRecord.cause) : "",
  ]
    .filter((value): value is string => typeof value === "string")
    .join(" ");

  return /invoice is already paid by another telegram charge/i.test(message);
}

export class TelegarmBot {
  instance: GrammyBot<TelegramBotContext>;
  webhookHandler: ReturnType<typeof webhookCallback>;
  private telegramPublishedCommands: Array<{
    command: string;
    description: string;
  }> = [];
  private mediaGroupBuffer = new Map<
    string,
    { messages: GrammyContext[]; timer: ReturnType<typeof setTimeout> }
  >();
  private learnCommandBuffer = new Map<
    string,
    { messages: GrammyContext[]; timer: ReturnType<typeof setTimeout> }
  >();
  constructor() {
    if (!TELEGRAM_SERVICE_BOT_TOKEN) {
      return;
    }

    this.instance = new GrammyBot<TelegramBotContext>(
      TELEGRAM_SERVICE_BOT_TOKEN || "",
    );

    this.webhookHandler = webhookCallback(this.instance, "hono") as any;
  }

  private getTelegramMessageThreadId(props: { ctx: GrammyContext }) {
    const messageThreadId = (props.ctx.message as any)?.message_thread_id;

    if (messageThreadId === undefined || messageThreadId === null) {
      return undefined;
    }

    return String(messageThreadId);
  }

  private getTelegramCommandTopicTitle(props: { description: string }) {
    const commandMatch = props.description
      .trim()
      .match(/^\/([a-z0-9_]+)(?=\s|$)/i);
    const command = commandMatch?.[1]?.toLowerCase();

    if (!command) {
      return;
    }

    const publishedCommand = this.telegramPublishedCommands?.find(
      (item) => item.command.toLowerCase() === command,
    );

    return (publishedCommand?.description.trim() || `/${command}`).slice(
      0,
      128,
    );
  }

  private isTelegramForumTopicServiceMessage(props: { ctx: GrammyContext }) {
    const message = props.ctx.message as any;

    return Boolean(
      message?.forum_topic_edited ||
        message?.forum_topic_closed ||
        message?.forum_topic_reopened ||
        message?.general_forum_topic_hidden ||
        message?.general_forum_topic_unhidden,
    );
  }

  private getTelegramForumTopicCreated(props: { ctx: GrammyContext }) {
    const message = props.ctx.message as any;

    if (!message?.forum_topic_created) {
      return;
    }

    const messageThreadId = this.getTelegramMessageThreadId({
      ctx: props.ctx,
    });

    if (!messageThreadId) {
      return;
    }

    return {
      messageThreadId,
    };
  }

  private async signSubjectJwt(props: { rbacModuleSubject: IRbacSubject }) {
    if (!RBAC_JWT_SECRET) {
      throw new Error("Configuration error. RBAC_JWT_SECRET is not set");
    }

    if (!RBAC_JWT_TOKEN_LIFETIME_IN_SECONDS) {
      throw new Error(
        "Configuration error. RBAC_JWT_TOKEN_LIFETIME_IN_SECONDS is not set",
      );
    }

    return jwt.sign(
      {
        exp: Math.floor(Date.now() / 1000) + RBAC_JWT_TOKEN_LIFETIME_IN_SECONDS,
        iat: Math.floor(Date.now() / 1000),
        subject: props.rbacModuleSubject,
      },
      RBAC_JWT_SECRET,
    );
  }

  private runInBackground(props: {
    label: string;
    task: () => Promise<void>;
    onError?: (
      error: unknown,
      metadata: ITelegramBackgroundErrorMetadata,
    ) => Promise<void>;
  }) {
    const backgroundTask = props.task().catch(async (error) => {
      const metadata = getTelegramBackgroundErrorMetadata(error);

      console.error("Telegram background task failed", {
        label: props.label,
        ...metadata,
      });

      if (!props.onError) {
        return;
      }

      try {
        await props.onError(error, metadata);
      } catch (notificationError) {
        console.error("Telegram error notification failed", {
          label: props.label,
          ...getTelegramBackgroundErrorMetadata(notificationError),
        });
      }
    });

    void backgroundTask;

    return backgroundTask;
  }

  private getIncomingMessageErrorText(props: {
    ctx: GrammyContext;
    errorId: string;
  }) {
    const languageCode = props.ctx.from?.language_code?.toLowerCase() || "";

    if (languageCode.startsWith("ru")) {
      return `Не удалось обработать сообщение. Попробуйте отправить его ещё раз. Код ошибки: ${props.errorId}.`;
    }

    return `We couldn't process your message. Please try sending it again. Reference: ${props.errorId}.`;
  }

  private async notifyIncomingMessageError(props: {
    ctx: GrammyContext;
    errorId: string;
  }) {
    const text = this.getIncomingMessageErrorText({
      ctx: props.ctx,
      errorId: props.errorId,
    });
    const messageThreadId = (props.ctx.message as any)?.message_thread_id;

    if (messageThreadId === undefined || messageThreadId === null) {
      await props.ctx.reply(text);
      return;
    }

    await props.ctx.reply(text, {
      message_thread_id: messageThreadId,
    });
  }

  private runIncomingMessageInBackground(props: {
    ctx: GrammyContext;
    label: string;
    task: () => Promise<void>;
  }) {
    return this.runInBackground({
      label: props.label,
      task: props.task,
      onError: async (_error, metadata) => {
        await this.notifyIncomingMessageError({
          ctx: props.ctx,
          errorId: metadata.errorId,
        });
      },
    });
  }

  private getTelegramStarPaymentText(props: {
    ctx: GrammyContext;
    variant: "success" | "refunded" | "processing-error";
    errorId?: string;
  }) {
    const isRussian = props.ctx.from?.language_code
      ?.toLowerCase()
      .startsWith("ru");

    if (props.variant === "success") {
      return isRussian
        ? "✅ Оплата успешно получена. Подписка будет активирована в ближайшее время."
        : "✅ Payment received successfully. Your subscription will be activated shortly.";
    }

    if (props.variant === "refunded") {
      return isRussian
        ? "↩️ Этот счёт уже недействителен или был оплачен ранее. Списанные Telegram Stars возвращены. Запросите новый счёт командой /premium."
        : "↩️ This invoice is no longer valid or was already paid. The charged Telegram Stars were refunded. Request a new invoice with /premium.";
    }

    return isRussian
      ? `⚠️ Telegram подтвердил платёж, но автоматическая обработка задержалась. Мы сохранили данные платежа. Код ошибки: ${props.errorId}.`
      : `⚠️ Telegram confirmed the payment, but automatic processing was delayed. We retained the payment details. Reference: ${props.errorId}.`;
  }

  private getTelegramStarPreCheckoutErrorText(ctx: GrammyContext) {
    const isRussian = ctx.from?.language_code?.toLowerCase().startsWith("ru");

    return isRussian
      ? "Счёт больше недействителен. Запросите новый счёт командой /premium."
      : "This invoice is no longer valid. Request a new invoice with /premium.";
  }

  async validateTelegramStarCheckout(props: {
    currency: string;
    totalAmount: number;
    invoicePayload: string;
    paidChargeId?: string;
  }): Promise<ITelegramStarCheckoutValidation> {
    if (!RBAC_SECRET_KEY) {
      throw new Error("Configuration error. RBAC_SECRET_KEY is not set");
    }

    if (props.currency !== "XTR") {
      return { ok: false, code: "currency" };
    }

    const invoice = await billingModuleInvoiceApi.findById({
      id: props.invoicePayload,
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          "Cache-Control": "no-store",
        },
      },
    });

    if (!invoice) {
      return { ok: false, code: "invoice" };
    }

    if (invoice.provider !== "telegram-star") {
      return { ok: false, code: "provider" };
    }

    if (Number(invoice.amount) !== Number(props.totalAmount)) {
      return { ok: false, code: "amount" };
    }

    if (
      invoice.status === "paid" &&
      props.paidChargeId &&
      invoice.providerId === props.paidChargeId
    ) {
      return {
        ok: true,
        invoice,
        idempotent: true,
      };
    }

    if (invoice.status !== "open") {
      return { ok: false, code: "status" };
    }

    const paymentIntentsToInvoices =
      await billingModulePaymentIntentsToInvoicesApi.find({
        params: {
          filters: {
            and: [
              {
                column: "invoiceId",
                method: "eq",
                value: invoice.id,
              },
            ],
          },
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
            "Cache-Control": "no-store",
          },
        },
      });

    if (!paymentIntentsToInvoices?.length) {
      return { ok: false, code: "payment-intent" };
    }

    const paymentIntents = await billingModulePaymentIntentApi.find({
      params: {
        filters: {
          and: [
            {
              column: "id",
              method: "inArray",
              value: paymentIntentsToInvoices.map(
                (relation) => relation.paymentIntentId,
              ),
            },
          ],
        },
      },
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          "Cache-Control": "no-store",
        },
      },
    });
    const payablePaymentIntentIds = (paymentIntents ?? [])
      .filter(
        (paymentIntent) =>
          !["succeeded", "canceled"].includes(paymentIntent.status),
      )
      .map((paymentIntent) => paymentIntent.id);

    if (!payablePaymentIntentIds.length) {
      return { ok: false, code: "payment-intent" };
    }

    const ordersToPaymentIntents =
      await ecommerceModuleOrdersToBillingModulePaymentIntentsApi.find({
        params: {
          filters: {
            and: [
              {
                column: "billingModulePaymentIntentId",
                method: "inArray",
                value: payablePaymentIntentIds,
              },
            ],
          },
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
            "Cache-Control": "no-store",
          },
        },
      });

    if (!ordersToPaymentIntents?.length) {
      return { ok: false, code: "order" };
    }

    const orders = await ecommerceModuleOrderApi.find({
      params: {
        filters: {
          and: [
            {
              column: "id",
              method: "inArray",
              value: ordersToPaymentIntents.map((relation) => relation.orderId),
            },
          ],
        },
      },
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          "Cache-Control": "no-store",
        },
      },
    });
    const hasPayableOrder = (orders ?? []).some((order) =>
      ["new", "paying"].includes(order.status),
    );

    if (!hasPayableOrder) {
      return { ok: false, code: "order" };
    }

    return {
      ok: true,
      invoice,
      idempotent: false,
    };
  }

  async handleTelegramStarPreCheckout(ctx: GrammyContext) {
    const query = ctx.preCheckoutQuery;

    if (!query) {
      throw new Error(
        "Validation error. Telegram pre-checkout query is required",
      );
    }

    const validation = await this.validateTelegramStarCheckout({
      currency: query.currency,
      totalAmount: query.total_amount,
      invoicePayload: query.invoice_payload,
    });

    if (!validation.ok) {
      await ctx.answerPreCheckoutQuery(false, {
        error_message: this.getTelegramStarPreCheckoutErrorText(ctx),
      });
      return;
    }

    await ctx.answerPreCheckoutQuery(true);
  }

  private async refundTelegramStarPayment(props: {
    ctx: GrammyContext;
    chargeId: string;
  }) {
    if (!props.ctx.from?.id) {
      throw new Error("Validation error. Telegram payment user id is required");
    }

    await props.ctx.api.refundStarPayment(props.ctx.from.id, props.chargeId);
    await props.ctx.reply(
      this.getTelegramStarPaymentText({
        ctx: props.ctx,
        variant: "refunded",
      }),
    );
  }

  async handleTelegramStarSuccessfulPayment(ctx: GrammyContext) {
    if (!RBAC_SECRET_KEY) {
      throw new Error("Configuration error. RBAC_SECRET_KEY is not set");
    }

    if (!ctx.message?.successful_payment) {
      throw new Error(
        "Validation error. Telegram successful payment is required",
      );
    }

    const payment = ctx.message.successful_payment;
    const validation = await this.validateTelegramStarCheckout({
      currency: payment.currency,
      totalAmount: payment.total_amount,
      invoicePayload: payment.invoice_payload,
      paidChargeId: payment.telegram_payment_charge_id,
    });

    if (validation.ok && validation.idempotent) {
      await ctx.reply(
        this.getTelegramStarPaymentText({
          ctx,
          variant: "success",
        }),
      );
      return;
    }

    if (!validation.ok) {
      await this.refundTelegramStarPayment({
        ctx,
        chargeId: payment.telegram_payment_charge_id,
      });
      return;
    }

    try {
      await billingModulePaymentIntentApi.providerWebhook({
        data: {
          provider: "telegram-star",
          currency: "XTR",
          invoice_payload: payment.invoice_payload,
          provider_payment_charge_id: payment.provider_payment_charge_id,
          telegram_payment_charge_id: payment.telegram_payment_charge_id,
          total_amount: payment.total_amount,
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
            "Cache-Control": "no-store",
          },
        },
      });
    } catch (error) {
      if (!isDuplicateTelegramStarPaymentError(error)) {
        throw error;
      }

      await this.refundTelegramStarPayment({
        ctx,
        chargeId: payment.telegram_payment_charge_id,
      });
      return;
    }

    await ctx.reply(
      this.getTelegramStarPaymentText({
        ctx,
        variant: "success",
      }),
    );
  }

  /**
   * Should be called after routes are added
   */
  init() {
    this.instance.on("chat_member", async (ctx) => {
      console.log("🚀 ~ init ~ ctx:", ctx);
      //
    });

    this.instance.on("channel_post", async (ctx) => {
      console.log("🚀 ~ init ~ ctx:", ctx);
      //
    });

    this.instance.on("callback_query:data", async (ctx) => {
      console.log(
        "🚀 ~ TelegarmBot ~ init ~ ctx.callbackQuery:",
        ctx.callbackQuery,
      );

      void ctx
        .answerCallbackQuery({
          text: `You clicked: ${ctx.callbackQuery.data}`,
        })
        .catch((error) => {
          console.error(
            "🚀 ~ TelegarmBot ~ callback_query:data ~ answer error:",
            error?.message || error,
          );
        });

      this.runInBackground({
        label: "callback_query:data",
        task: async () => {
          if (!RBAC_SECRET_KEY) {
            throw new Error("Configuration error. RBAC_SECRET_KEY is not set");
          }

          if (!RBAC_JWT_SECRET) {
            throw new Error("Configuration error. RBAC_JWT_SECRET is not set");
          }

          if (!RBAC_JWT_TOKEN_LIFETIME_IN_SECONDS) {
            throw new Error(
              "Configuration error. RBAC_JWT_TOKEN_LIFETIME_IN_SECONDS is not set",
            );
          }

          const callbackMessage = ctx.callbackQuery.message as any;
          const callbackMessageThreadId =
            callbackMessage?.message_thread_id !== undefined &&
            callbackMessage?.message_thread_id !== null
              ? String(callbackMessage.message_thread_id)
              : undefined;

          const {
            rbacModuleSubject,
            socialModuleProfile,
            socialModuleChat,
            socialModuleThread,
          } =
            await this.rbacModuleSubjectWithSocialModuleProfileAndChatFindOrCreate(
              {
                ctx,
                telegram: callbackMessageThreadId
                  ? {
                      messageThreadId: callbackMessageThreadId,
                      isTopicMessage: Boolean(
                        callbackMessage?.is_topic_message,
                      ),
                    }
                  : undefined,
              },
            );

          console.log("🚀 ~ init ~ rbacModuleSubject:", rbacModuleSubject);

          const jwtToken = await jwt.sign(
            {
              exp:
                Math.floor(Date.now() / 1000) +
                RBAC_JWT_TOKEN_LIFETIME_IN_SECONDS,
              iat: Math.floor(Date.now() / 1000),
              subject: rbacModuleSubject,
            },
            RBAC_JWT_SECRET,
          );

          await rbacModuleSubjectApi.socialModuleProfileFindByIdChatFindByIdActionCreate(
            {
              id: rbacModuleSubject.id,
              socialModuleChatId: socialModuleChat.id,
              socialModuleProfileId: socialModuleProfile.id,
              data: {
                socialModuleThreadId: socialModuleThread.id,
                payload: {
                  telegram: {
                    callback_query: ctx.callbackQuery,
                  },
                },
              },
              options: {
                headers: {
                  Authorization: "Bearer " + jwtToken,
                },
              },
            },
          );
        },
      });

      return;
    });

    // Telegram Stars requires answering the pre-checkout query, otherwise Telegram will not send the payment to completion.
    /**
     * update: {
    update_id: 811067301,
    pre_checkout_query: {
      id: "2365707987652326824",
      from: {
        id: 450805355,
        is_bot: false,
        first_name: "NAME",
        username: "slug",
        language_code: "ru",
        is_premium: true,
      },
      currency: "XTR",
      total_amount: 1,
      invoice_payload: "123",
    },
  },
     */
    this.instance.on("pre_checkout_query", async (ctx) => {
      try {
        console.log("🚀 ~ init ~ pre_checkout_query ~ ctx.update:", ctx.update);

        await this.handleTelegramStarPreCheckout(ctx);
        return;
      } catch (error: any) {
        console.log("🚀 ~ init ~ pre_checkout_query ~ error:", error.message);
        await ctx
          .answerPreCheckoutQuery(false, {
            error_message: this.getTelegramStarPreCheckoutErrorText(ctx),
          })
          .catch(() => undefined);
        return;
      }
    });

    // Handle successful payment update to finalize flow and notify the user.
    /**
     * update: {
    update_id: 811067302,
    message: {
      message_id: 1833,
      from: {
        id: 450805355,
        is_bot: false,
        first_name: "NAME",
        username: "slug",
        language_code: "ru",
        is_premium: true,
      },
      chat: {
        id: 450805355,
        first_name: "NAME",
        username: "slug",
        type: "private",
      },
      date: 1766269675,
      successful_payment: {
        currency: "XTR",
        total_amount: 1,
        invoice_payload: "123",
        telegram_payment_charge_id: "stxg0Uc3yXT5P7_DbX8cufsr4Ioxybu62SQsfCnGUSpalt-EQwyRzNt04ssHyggdsJ5DWRLxOQi64aJ1duinyQvpAEGcFMB90E54riVs-U8bS4",
        provider_payment_charge_id: "550809313_1",
      },
    },
  },
     */
    this.instance.on("message:successful_payment", async (ctx) => {
      console.log(
        "🚀 ~ init ~ message:successful_payment ~ payment:",
        ctx.message.successful_payment,
      );

      this.runInBackground({
        label: "message:successful_payment",
        task: async () => {
          await this.handleTelegramStarSuccessfulPayment(ctx);
        },
        onError: async (_error, metadata) => {
          await ctx.reply(
            this.getTelegramStarPaymentText({
              ctx,
              variant: "processing-error",
              errorId: metadata.errorId,
            }),
          );
        },
      });

      return;
    });

    this.instance.on("message", async (ctx) => {
      if (isTelegramBotAuthoredMessage(ctx.message)) {
        return;
      }

      console.log("🚀 ~ init ~ on message ~ ctx.message", ctx.message);

      const telegramForumTopicCreated = this.getTelegramForumTopicCreated({
        ctx,
      });

      if (telegramForumTopicCreated) {
        this.runIncomingMessageInBackground({
          ctx,
          label: "message:forum_topic_created",
          task: async () => {
            await this.rbacModuleSubjectWithSocialModuleProfileAndChatFindOrCreate(
              {
                ctx,
                telegram: {
                  messageThreadId: telegramForumTopicCreated.messageThreadId,
                  isTopicMessage: true,
                },
              },
            );
          },
        });

        return;
      }

      if (
        this.isTelegramForumTopicServiceMessage({
          ctx,
        })
      ) {
        return;
      }

      const telegramVoice = extractTelegramVoiceMessageData(ctx.message);

      if (telegramVoice) {
        this.runIncomingMessageInBackground({
          ctx,
          label: "message:voice",
          task: async () => {
            await this.handleIncomingVoiceMessage({
              ctx,
              voice: telegramVoice,
            });
          },
        });

        return;
      }

      const telegramAudio = extractTelegramAudioMessageData(ctx.message);

      if (telegramAudio) {
        this.runIncomingMessageInBackground({
          ctx,
          label: "message:audio",
          task: async () => {
            await this.handleIncomingVoiceMessage({
              ctx,
              voice: telegramAudio,
            });
          },
        });

        return;
      }

      const mediaGroupId = ctx.message?.media_group_id;

      if (mediaGroupId) {
        const existing = this.mediaGroupBuffer.get(mediaGroupId);
        const messages = existing?.messages ?? [];
        messages.push(ctx);

        if (existing?.timer) {
          clearTimeout(existing.timer);
        }

        const timer = setTimeout(() => {
          this.runIncomingMessageInBackground({
            ctx,
            label: "message:media-group",
            task: async () => {
              await this.flushMediaGroup({
                mediaGroupId,
              });
            },
          });
        }, 600);

        this.mediaGroupBuffer.set(mediaGroupId, { messages, timer });
        return;
      }

      this.runIncomingMessageInBackground({
        ctx,
        label: "message",
        task: async () => {
          if (
            this.bufferTelegramLearnCommandMessage({
              ctx,
            })
          ) {
            return;
          }

          await this.handleIncomingMessage({
            ctx,
            data: await this.buildTelegramMessageData({ ctx }),
          });
        },
      });

      return;
    });
  }

  async run() {
    if (!TELEGRAM_SERVICE_BOT_TOKEN) {
      throw new Error(
        "Configuration error. TELEGRAM_SERVICE_BOT_TOKEN is not set",
      );
    }

    if (!RBAC_SECRET_KEY) {
      throw new Error("Configuration error. RBAC_SECRET_KEY is not set");
    }

    const commands = await agentModuleAgentApi.telegramCommands({
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          "Cache-Control": "no-store",
        },
      },
    });
    this.telegramPublishedCommands = commands;

    await Promise.all([
      this.instance.api.setMyCommands(commands),
      this.instance.api.setMyCommands(commands, {
        scope: {
          type: "all_private_chats",
        },
      }),
      this.instance.api.setMyCommands(commands, {
        scope: {
          type: "all_group_chats",
        },
      }),
      this.instance.api.setMyCommands(commands, {
        scope: {
          type: "all_chat_administrators",
        },
      }),
    ]);

    const endpoint = NEXT_PUBLIC_TELEGRAM_SERVICE_URL + "/api/telegram";

    const res = await this.instance.api.setWebhook(endpoint, {
      // Empty list resets any previous webhook update filter and enables all updates.
      allowed_updates: [],
    });

    return res;
  }

  async stop() {
    if (!TELEGRAM_SERVICE_BOT_TOKEN) {
      throw new Error(
        "Configuration error. TELEGRAM_SERVICE_BOT_TOKEN is not set",
      );
    }

    const res = await this.instance.api.deleteWebhook();

    return res;
  }

  async rbacModuleSubjectWithSocialModuleProfileAndChatFindOrCreate(props: {
    ctx: GrammyContext;
    telegram?: {
      messageText?: string;
      messageThreadId?: string;
      isTopicMessage?: boolean;
    };
  }): Promise<{
    rbacModuleSubject: IRbacSubject;
    personalAiRbacModuleSubject: IRbacSubject;
    socialModuleProfile: ISocialModuleProfile;
    personalAiSocialModuleProfile: ISocialModuleProfile;
    socialModuleChat: ISocialModuleChat;
    socialModuleThread: ISocialModuleThread;
  }> {
    if (!RBAC_SECRET_KEY) {
      throw new Error("Configuration error. RBAC_SECRET_KEY is not set");
    }

    if (!props.ctx.from?.id) {
      throw new Error("Validation error. Telegram user id is required");
    }

    if (!props.ctx.chat?.id) {
      throw new Error("Validation error. Telegram chat id is required");
    }

    const messageText =
      props.telegram?.messageText ||
      props.ctx.message?.text ||
      props.ctx.message?.caption;
    const messageThreadId =
      props.telegram?.messageThreadId ||
      this.getTelegramMessageThreadId({
        ctx: props.ctx,
      });

    const bootstrap = await this.telegramBootstrapWithRetry({
      data: {
        telegram: {
          fromId: props.ctx.from.id,
          chatId: props.ctx.chat.id,
          messageText,
          messageThreadId,
          isTopicMessage:
            props.telegram?.isTopicMessage ??
            Boolean((props.ctx.message as any)?.is_topic_message),
        },
      },
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          "Cache-Control": "no-store",
        },
      },
    });

    await this.synchronizeRbacModuleRole({
      ctx: props.ctx,
      rbacModuleSubject: bootstrap.rbacModuleSubject,
    });

    if (bootstrap.shouldCheckoutFreeSubscription) {
      await this.checkoutFreeSubscriptionEcommerceModuleProducts({
        ctx: props.ctx,
        rbacModuleSubject: bootstrap.rbacModuleSubject,
      });
    }

    return {
      rbacModuleSubject: bootstrap.rbacModuleSubject,
      personalAiRbacModuleSubject: bootstrap.personalAiRbacModuleSubject,
      socialModuleProfile: bootstrap.socialModuleProfile,
      personalAiSocialModuleProfile: bootstrap.personalAiSocialModuleProfile,
      socialModuleChat: bootstrap.socialModuleChat,
      socialModuleThread: bootstrap.socialModuleThread,
    };
  }

  private async telegramBootstrapWithRetry(
    props: Parameters<typeof rbacModuleSubjectApi.telegramBootstrap>[0],
  ) {
    const retryDelays = this.getTelegramBootstrapRetryDelays();

    for (let attempt = 0; ; attempt += 1) {
      try {
        return await rbacModuleSubjectApi.telegramBootstrap(props);
      } catch (error) {
        const retryDelayMs = retryDelays[attempt];

        if (retryDelayMs === undefined || !isTransientTelegramApiError(error)) {
          throw error;
        }

        console.warn(
          "Telegram API bootstrap temporarily unavailable; retrying",
          {
            attempt: attempt + 1,
            retryDelayMs,
            ...getTelegramBackgroundErrorMetadata(error),
          },
        );

        await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
      }
    }
  }

  protected getTelegramBootstrapRetryDelays() {
    return TELEGRAM_BOOTSTRAP_RETRY_DELAYS_MS;
  }

  async synchronizeRbacModuleRole(props: {
    ctx: GrammyContext;
    rbacModuleSubject: IRbacSubject;
  }) {
    if (!RBAC_SECRET_KEY) {
      throw new Error("Configuration error. 'RBAC_SECRET_KEY' no set.");
    }
    let memberStatus: string | undefined;

    if (
      TELEGRAM_SERVICE_REQUIRED_SUBSCRIPTION_CHANNEL_ID &&
      props.ctx.from?.id
    ) {
      const member = await props.ctx.api.getChatMember(
        TELEGRAM_SERVICE_REQUIRED_SUBSCRIPTION_CHANNEL_ID,
        props.ctx.from.id,
      );

      memberStatus = member.status;
    }

    await rbacModuleSubjectApi.telegramSyncMembership({
      id: props.rbacModuleSubject.id,
      data: {
        memberStatus,
      },
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          "Cache-Control": "no-store",
        },
      },
    });
  }

  async checkoutFreeSubscriptionEcommerceModuleProducts(props: {
    ctx: GrammyContext;
    rbacModuleSubject: IRbacSubject;
  }) {
    if (!RBAC_SECRET_KEY) {
      throw new Error("Configuration error. 'RBAC_SECRET_KEY' no set.");
    }

    if (!props.ctx.chatId) {
      return;
    }

    await rbacModuleSubjectApi.telegramCheckoutFreeSubscription({
      id: props.rbacModuleSubject.id,
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          "Cache-Control": "no-store",
        },
      },
      data: {
        chatId: String(props.ctx.chatId),
      },
    });
  }

  private async buildTelegramMessageData(props: { ctx: GrammyContext }) {
    if (!TELEGRAM_SERVICE_BOT_TOKEN) {
      throw new Error(
        "Configuration error. TELEGRAM_SERVICE_BOT_TOKEN is not set",
      );
    }

    const message = props.ctx.message;
    const description = message?.text || message?.caption || "";
    const sourceSystemId = message?.message_id?.toString() || "";

    if (!message) {
      return { description, sourceSystemId };
    }

    const attachments: TelegramAttachmentCandidate[] = [];

    if (message.photo?.length) {
      const photo = message.photo[message.photo.length - 1];
      attachments.push({
        fileId: photo.file_id,
        title: `photo-${photo.file_unique_id}`,
        mimeType: "image/jpeg",
      });
    }

    if (message.document) {
      attachments.push({
        fileId: message.document.file_id,
        fileName: message.document.file_name,
        title: message.document.file_name
          ? splitFileName(message.document.file_name).title
          : `document-${message.document.file_unique_id}`,
        mimeType: message.document.mime_type,
      });
    }

    if (message.video) {
      attachments.push({
        fileId: message.video.file_id,
        fileName: message.video.file_name,
        title: message.video.file_name
          ? splitFileName(message.video.file_name).title
          : `video-${message.video.file_unique_id}`,
        mimeType: message.video.mime_type,
      });
    }

    if (message.audio) {
      attachments.push({
        fileId: message.audio.file_id,
        fileName: message.audio.file_name,
        title: message.audio.file_name
          ? splitFileName(message.audio.file_name).title
          : `audio-${message.audio.file_unique_id}`,
        mimeType: message.audio.mime_type,
      });
    }

    if (!attachments.length) {
      return { description, sourceSystemId };
    }

    const files = await this.buildTelegramFiles({
      ctx: props.ctx,
      attachments,
    });

    return {
      description,
      sourceSystemId,
      files,
    };
  }

  private async buildTelegramMessageDataFromMessages(props: {
    ctx: GrammyContext;
    messages: GrammyContext[];
  }) {
    const messageList = props.messages
      .map((item) => item.message)
      .filter(Boolean);

    const description = messageList
      .map((message) => message?.text || message?.caption || "")
      .map((value) => value.trim())
      .filter(Boolean)
      .join("\n");

    const sourceSystemId =
      messageList.find((message) => message?.media_group_id)?.media_group_id ||
      messageList[0]?.message_id?.toString() ||
      "";
    const metadata = {
      telegram: {
        sourceMessageIds: messageList
          .map((message) => message?.message_id)
          .filter((messageId) => messageId !== undefined),
      },
    };

    const attachments = messageList.flatMap((message) =>
      this.extractTelegramAttachments(message),
    );

    if (!attachments.length) {
      return { description, sourceSystemId, metadata };
    }

    const files = await this.buildTelegramFiles({
      ctx: props.ctx,
      attachments,
    });

    return {
      description,
      sourceSystemId,
      files,
      metadata,
    };
  }

  private extractTelegramAttachments(
    message: any,
  ): TelegramAttachmentCandidate[] {
    const attachments: TelegramAttachmentCandidate[] = [];

    if (message?.photo?.length) {
      const photo = message.photo[message.photo.length - 1];
      attachments.push({
        fileId: photo.file_id,
        title: `photo-${photo.file_unique_id}`,
        mimeType: "image/jpeg",
      });
    }

    if (message?.document) {
      attachments.push({
        fileId: message.document.file_id,
        fileName: message.document.file_name,
        title: message.document.file_name
          ? splitFileName(message.document.file_name).title
          : `document-${message.document.file_unique_id}`,
        mimeType: message.document.mime_type,
      });
    }

    if (message?.video) {
      attachments.push({
        fileId: message.video.file_id,
        fileName: message.video.file_name,
        title: message.video.file_name
          ? splitFileName(message.video.file_name).title
          : `video-${message.video.file_unique_id}`,
        mimeType: message.video.mime_type,
      });
    }

    if (message?.audio) {
      attachments.push({
        fileId: message.audio.file_id,
        fileName: message.audio.file_name,
        title: message.audio.file_name
          ? splitFileName(message.audio.file_name).title
          : `audio-${message.audio.file_unique_id}`,
        mimeType: message.audio.mime_type,
      });
    }

    return attachments;
  }

  private async buildTelegramFiles(props: {
    ctx: GrammyContext;
    attachments: TelegramAttachmentCandidate[];
  }) {
    if (!TELEGRAM_SERVICE_BOT_TOKEN) {
      throw new Error(
        "Configuration error. TELEGRAM_SERVICE_BOT_TOKEN is not set",
      );
    }

    const uniqueAttachments = new Map(
      props.attachments.map((attachment) => [attachment.fileId, attachment]),
    );

    const telegramFiles = await Promise.all(
      [...uniqueAttachments.values()].map(async (attachment) => {
        const fileInfo = await props.ctx.api.getFile(attachment.fileId);

        if (!fileInfo.file_path) {
          throw new Error(
            `Telegram file_path missing for file_id ${attachment.fileId}`,
          );
        }

        const inferred = splitFileName(
          attachment.fileName || fileInfo.file_path,
        );
        const title = attachment.title || inferred.title || attachment.fileId;
        const extension = inferred.extension || "bin";
        const type = attachment.mimeType || "application/octet-stream";
        const url = `https://api.telegram.org/file/bot${TELEGRAM_SERVICE_BOT_TOKEN}/${fileInfo.file_path}`;

        return {
          shouldConvertAudioToMp3: this.isTelegramAudioAttachment({
            extension,
            mimeType: type,
          }),
          title,
          extension,
          type,
          url,
        };
      }),
    );

    const files = await blobifyFiles({
      files: telegramFiles,
    });

    return await Promise.all(
      files.map(async (file, index) => {
        const telegramFile = telegramFiles[index];

        if (!telegramFile?.shouldConvertAudioToMp3) {
          return file;
        }

        if (
          file.type === "audio/mpeg" &&
          file.name.toLowerCase().endsWith(".mp3")
        ) {
          return file;
        }

        return await this.convertTelegramAudioFileToMp3({
          file,
          title: telegramFile.title,
        });
      }),
    );
  }

  private isTelegramAudioAttachment(props: {
    extension?: string;
    mimeType?: string;
  }) {
    if (props.mimeType?.startsWith("audio/")) {
      return true;
    }

    return Boolean(
      props.extension &&
        TELEGRAM_AUDIO_EXTENSIONS.includes(props.extension.toLowerCase()),
    );
  }

  private async convertTelegramAudioFileToMp3(props: {
    file: File;
    title: string;
  }) {
    const tempDirectory = await mkdtemp(join(tmpdir(), "sps-telegram-audio-"));
    const inputExtension =
      props.file.name.split("?")[0].split(".").pop() || "bin";
    const inputPath = join(tempDirectory, `input.${inputExtension}`);
    const outputPath = join(tempDirectory, "output.mp3");

    try {
      const inputBuffer = Buffer.from(await props.file.arrayBuffer());
      await writeFile(inputPath, inputBuffer);

      await this.runFfmpeg([
        "-y",
        "-hide_banner",
        "-loglevel",
        "error",
        "-i",
        inputPath,
        "-vn",
        "-codec:a",
        "libmp3lame",
        "-q:a",
        "2",
        outputPath,
      ]);

      const outputBuffer = await readFile(outputPath);

      return new File(
        [new Uint8Array(outputBuffer)],
        `${sanitizeFileTitle(props.title)}.mp3`,
        {
          type: "audio/mpeg",
        },
      ) as unknown as File;
    } catch (error) {
      throw new Error(
        `Telegram audio conversion to MP3 failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    } finally {
      await rm(tempDirectory, {
        force: true,
        recursive: true,
      });
    }
  }

  private runFfmpeg(args: string[]) {
    return new Promise<void>((resolve, reject) => {
      const child = spawn("ffmpeg", args, {
        stdio: ["ignore", "ignore", "pipe"],
      });
      const stderr: Buffer[] = [];

      child.stderr?.on("data", (chunk) => {
        stderr.push(Buffer.from(chunk));
      });

      child.on("error", reject);
      child.on("close", (code) => {
        if (code === 0) {
          resolve();
          return;
        }

        reject(
          new Error(
            `ffmpeg exited with code ${code}: ${Buffer.concat(stderr)
              .toString("utf8")
              .trim()}`,
          ),
        );
      });
    });
  }

  private shouldHandleIncomingMessageInChat(props: { ctx: GrammyContext }) {
    if (!TELEGRAM_SERVICE_BOT_USERNAME) {
      throw new Error(
        "Configuration error. 'TELEGRAM_SERVICE_BOT_USERNAME' is not set",
      );
    }

    const isGroup = props.ctx.chat?.id && props.ctx.chat.id < 0;

    if (!isGroup) {
      return true;
    }

    const messageText = props.ctx.message?.text || props.ctx.message?.caption;
    const replyToUsername = (props.ctx.message as any)?.reply_to_message?.from
      ?.username;

    return isTelegramMessageAddressedToBot({
      botUsername: TELEGRAM_SERVICE_BOT_USERNAME,
      description: messageText,
      isReplyToBot:
        typeof replyToUsername === "string" &&
        replyToUsername.toLowerCase() ===
          TELEGRAM_SERVICE_BOT_USERNAME.replace(/^@/, "").toLowerCase(),
    });
  }

  private getTelegramLearnCommandBufferKey(props: { ctx: GrammyContext }) {
    const chatId = props.ctx.chat?.id;
    const senderId = props.ctx.from?.id;

    if (chatId === undefined || senderId === undefined) {
      return;
    }

    const messageThreadId = this.getTelegramMessageThreadId({
      ctx: props.ctx,
    });

    return [
      String(chatId),
      messageThreadId || "default",
      String(senderId),
    ].join(":");
  }

  private scheduleTelegramLearnCommandBufferFlush(props: {
    key: string;
    messages: GrammyContext[];
  }) {
    const timer = setTimeout(() => {
      const ctx = props.messages[0];

      if (!ctx) {
        return;
      }

      this.runIncomingMessageInBackground({
        ctx,
        label: "message:learn:flush",
        task: async () => {
          await this.flushTelegramLearnCommandBuffer({ key: props.key });
        },
      });
    }, TELEGRAM_LEARN_CHUNK_DEBOUNCE_MS);

    this.learnCommandBuffer.set(props.key, {
      messages: props.messages,
      timer,
    });
  }

  private bufferTelegramLearnCommandMessage(props: { ctx: GrammyContext }) {
    if (!TELEGRAM_SERVICE_BOT_USERNAME) {
      throw new Error(
        "Configuration error. 'TELEGRAM_SERVICE_BOT_USERNAME' is not set",
      );
    }

    const key = this.getTelegramLearnCommandBufferKey({ ctx: props.ctx });

    if (!key) {
      return false;
    }

    const description = normalizeTelegramTransportControls({
      botUsername: TELEGRAM_SERVICE_BOT_USERNAME,
      description: props.ctx.message?.text || props.ctx.message?.caption || "",
    });
    const isLearnCommand = isTelegramLearnCommand(description);
    const existing = this.learnCommandBuffer.get(key);

    if (!existing && !isLearnCommand) {
      return false;
    }

    if (existing?.timer) {
      clearTimeout(existing.timer);
    }

    if (existing && isLearnCommand) {
      this.learnCommandBuffer.delete(key);
      const bufferedContext = existing.messages[0] || props.ctx;

      this.runIncomingMessageInBackground({
        ctx: bufferedContext,
        label: "message:learn:flush-before-next-command",
        task: async () => {
          await this.persistTelegramLearnCommandMessages({
            messages: existing.messages,
          });
        },
      });
      this.scheduleTelegramLearnCommandBufferFlush({
        key,
        messages: [props.ctx],
      });
      return true;
    }

    if (existing && /^\/[a-z0-9_]+(?=\s|$)/i.test(description)) {
      this.scheduleTelegramLearnCommandBufferFlush({
        key,
        messages: existing.messages,
      });
      return false;
    }

    this.scheduleTelegramLearnCommandBufferFlush({
      key,
      messages: [...(existing?.messages || []), props.ctx],
    });

    return true;
  }

  private async downloadTelegramVoiceFile(props: {
    ctx: GrammyContext;
    voice: TelegramVoiceMessageData;
  }) {
    const files = await this.buildTelegramFiles({
      ctx: props.ctx,
      attachments: [
        {
          fileId: props.voice.fileId,
          mimeType: props.voice.mimeType || "audio/ogg",
          title: `telegram-voice-${
            props.voice.fileUniqueId || props.voice.sourceSystemId
          }`,
        },
      ],
    });

    const [file] = files;

    if (!file) {
      throw new Error("Telegram voice file download returned no files");
    }

    return file;
  }

  private async findExistingTelegramMessageBySourceSystemId(props: {
    jwtToken: string;
    rbacModuleSubject: IRbacSubject;
    socialModuleChat: ISocialModuleChat;
    socialModuleProfile: ISocialModuleProfile;
    socialModuleThread: ISocialModuleThread;
    sourceSystemId: string;
  }) {
    const messages =
      await rbacModuleSubjectApi.socialModuleProfileFindByIdChatFindByIdThreadFindByIdMessageFind(
        {
          id: props.rbacModuleSubject.id,
          socialModuleChatId: props.socialModuleChat.id,
          socialModuleThreadId: props.socialModuleThread.id,
          socialModuleProfileId: props.socialModuleProfile.id,
          params: {
            limit: 100,
          },
          options: {
            headers: {
              Authorization: "Bearer " + props.jwtToken,
            },
          },
        },
      );

    return messages.find(
      (message) => message.sourceSystemId === props.sourceSystemId,
    );
  }

  private async handleIncomingVoiceMessage(props: {
    ctx: GrammyContext;
    voice: TelegramVoiceMessageData;
  }) {
    if (!RBAC_SECRET_KEY) {
      throw new Error("Configuration error. RBAC_SECRET_KEY is not set");
    }

    if (!RBAC_JWT_SECRET) {
      throw new Error("Configuration error. RBAC_JWT_SECRET is not set");
    }

    if (!RBAC_JWT_TOKEN_LIFETIME_IN_SECONDS) {
      throw new Error(
        "Configuration error. RBAC_JWT_TOKEN_LIFETIME_IN_SECONDS is not set",
      );
    }

    if (!TELEGRAM_SERVICE_BOT_USERNAME) {
      throw new Error(
        "Configuration error. 'TELEGRAM_SERVICE_BOT_USERNAME' is not set",
      );
    }

    const messageText = props.ctx.message?.text || props.ctx.message?.caption;

    const {
      rbacModuleSubject,
      socialModuleProfile,
      socialModuleChat,
      socialModuleThread,
    } = await this.rbacModuleSubjectWithSocialModuleProfileAndChatFindOrCreate({
      ctx: props.ctx,
      telegram: {
        messageText,
      },
    });

    if (
      !this.shouldHandleIncomingMessageInChat({
        ctx: props.ctx,
      })
    ) {
      return;
    }

    const jwtToken = await this.signSubjectJwt({ rbacModuleSubject });
    const existingMessage =
      await this.findExistingTelegramMessageBySourceSystemId({
        jwtToken,
        rbacModuleSubject,
        socialModuleChat,
        socialModuleProfile,
        socialModuleThread,
        sourceSystemId: props.voice.sourceSystemId,
      });

    if (existingMessage) {
      return existingMessage;
    }

    const file = await this.downloadTelegramVoiceFile({
      ctx: props.ctx,
      voice: props.voice,
    });

    return await rbacModuleSubjectApi.socialModuleProfileFindByIdChatFindByIdThreadFindByIdMessageCreate(
      {
        id: rbacModuleSubject.id,
        socialModuleChatId: socialModuleChat.id,
        socialModuleThreadId: socialModuleThread.id,
        socialModuleProfileId: socialModuleProfile.id,
        data: {
          description: normalizeTelegramTransportControls({
            botUsername: TELEGRAM_SERVICE_BOT_USERNAME,
            description: messageText || "",
          }),
          files: [file],
          metadata: {
            telegram: {
              audio: {
                duration: props.voice.duration,
                fileId: props.voice.fileId,
                fileUniqueId: props.voice.fileUniqueId,
                mimeType: props.voice.mimeType,
              },
            },
          },
          sourceSystemId: props.voice.sourceSystemId,
        },
        options: {
          headers: {
            Authorization: "Bearer " + jwtToken,
          },
        },
      },
    );
  }

  private async handleIncomingMessage(props: {
    ctx: GrammyContext;
    data: {
      description: string;
      sourceSystemId: string;
      files?: File[];
      metadata?: Record<string, unknown>;
    };
  }) {
    if (!RBAC_SECRET_KEY) {
      throw new Error("Configuration error. RBAC_SECRET_KEY is not set");
    }

    if (!RBAC_JWT_SECRET) {
      throw new Error("Configuration error. RBAC_JWT_SECRET is not set");
    }

    if (!RBAC_JWT_TOKEN_LIFETIME_IN_SECONDS) {
      throw new Error(
        "Configuration error. RBAC_JWT_TOKEN_LIFETIME_IN_SECONDS is not set",
      );
    }

    if (!TELEGRAM_SERVICE_BOT_USERNAME) {
      throw new Error(
        "Configuration error. 'TELEGRAM_SERVICE_BOT_USERNAME' is not set",
      );
    }

    const isGroup = props.ctx.chat?.id && props.ctx.chat.id < 0;
    const isMentioned = this.shouldHandleIncomingMessageInChat({
      ctx: props.ctx,
    });

    if (isGroup && !isMentioned) {
      return;
    }

    const {
      rbacModuleSubject,
      socialModuleProfile,
      socialModuleChat,
      socialModuleThread,
    } = await this.rbacModuleSubjectWithSocialModuleProfileAndChatFindOrCreate({
      ctx: props.ctx,
    });

    const jwtToken = await this.signSubjectJwt({ rbacModuleSubject });

    const sanitizedDescription = normalizeTelegramTransportControls({
      botUsername: TELEGRAM_SERVICE_BOT_USERNAME,
      description: props.data.description,
    });
    const commandTopicTitle = this.getTelegramCommandTopicTitle({
      description: sanitizedDescription,
    });
    const targetSocialModuleThread =
      commandTopicTitle && !this.getTelegramMessageThreadId({ ctx: props.ctx })
        ? await rbacModuleSubjectApi.socialModuleChatFindByIdThreadCreate({
            id: rbacModuleSubject.id,
            socialModuleChatId: socialModuleChat.id,
            data: {
              title: commandTopicTitle,
            },
            options: {
              headers: {
                Authorization: "Bearer " + jwtToken,
              },
            },
          })
        : socialModuleThread;

    return await rbacModuleSubjectApi.socialModuleProfileFindByIdChatFindByIdThreadFindByIdMessageCreate(
      {
        id: rbacModuleSubject.id,
        socialModuleChatId: socialModuleChat.id,
        socialModuleThreadId: targetSocialModuleThread.id,
        socialModuleProfileId: socialModuleProfile.id,
        data: {
          ...props.data,
          description: sanitizedDescription,
        },
        options: {
          headers: {
            Authorization: "Bearer " + jwtToken,
          },
        },
      },
    );
  }

  private async flushMediaGroup(props: { mediaGroupId: string }) {
    const entry = this.mediaGroupBuffer.get(props.mediaGroupId);

    if (!entry) {
      return;
    }

    this.mediaGroupBuffer.delete(props.mediaGroupId);

    const ctx = entry.messages[0];
    if (!ctx) {
      return;
    }

    const data = await this.buildTelegramMessageDataFromMessages({
      ctx,
      messages: entry.messages,
    });

    await this.handleIncomingMessage({
      ctx,
      data,
    });
  }

  private async flushTelegramLearnCommandBuffer(props: { key: string }) {
    const entry = this.learnCommandBuffer.get(props.key);

    if (!entry) {
      return;
    }

    clearTimeout(entry.timer);
    this.learnCommandBuffer.delete(props.key);

    await this.persistTelegramLearnCommandMessages({
      messages: entry.messages,
    });
  }

  private async persistTelegramLearnCommandMessages(props: {
    messages: GrammyContext[];
  }) {
    const ctx = props.messages[0];

    if (!ctx) {
      return;
    }

    const data = await this.buildTelegramMessageDataFromMessages({
      ctx,
      messages: props.messages,
    });

    await this.handleIncomingMessage({
      ctx,
      data,
    });
  }
}
