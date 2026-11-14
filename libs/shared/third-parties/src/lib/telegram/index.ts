import { createHash } from "node:crypto";
import { Bot, type Context, type Transformer } from "grammy";
import { Provider } from "@sps/providers-kv";
import { DeliveryRateLimit, DeliveryDeferredError } from "@sps/backend-utils";
import {
  KV_PROVIDER,
  NOTIFICATION_DELIVERY_WAIT_MS,
  NOTIFICATION_TELEGRAM_MESSAGES_PER_SECOND,
  NOTIFICATION_TELEGRAM_CHAT_INTERVAL_MS,
  NOTIFICATION_TELEGRAM_GROUP_INTERVAL_MS,
} from "@sps/shared-utils";

export function telegramDeliveryRateLimit(token: string): Transformer {
  const rate = NOTIFICATION_TELEGRAM_MESSAGES_PER_SECOND;
  const chatInterval = NOTIFICATION_TELEGRAM_CHAT_INTERVAL_MS;
  const groupInterval = NOTIFICATION_TELEGRAM_GROUP_INTERVAL_MS;
  if (
    rate <= 0 ||
    rate > 30 ||
    !Number.isFinite(rate) ||
    chatInterval < 1000 ||
    !Number.isFinite(chatInterval) ||
    groupInterval < 3000 ||
    !Number.isFinite(groupInterval) ||
    !Number.isFinite(NOTIFICATION_DELIVERY_WAIT_MS) ||
    NOTIFICATION_DELIVERY_WAIT_MS < 0 ||
    NOTIFICATION_DELIVERY_WAIT_MS > 30000
  ) {
    throw new Error(
      "Configuration error. Invalid Telegram notification limits",
    );
  }
  const store = new Provider({ type: KV_PROVIDER });
  const limiter = new DeliveryRateLimit(store);
  const botId = createHash("sha256").update(token.split(":")[0]).digest("hex");
  const globalKey = `telegram:${botId}`;

  return async (previous, method, payload, signal) => {
    const values = payload as Record<string, unknown>;
    const chat = values.chat_id;
    // Polling, command registration, payments and callback acknowledgements
    // have separate deadlines. Only outgoing chat writes consume this budget.
    if (chat === undefined || /^(get|set|answer)/.test(method)) {
      return previous(method, payload, signal);
    }
    let cost = 1;
    if (method === "sendMediaGroup" && Array.isArray(values.media)) {
      cost = values.media.length;
    }
    if (
      (method === "copyMessages" || method === "forwardMessages") &&
      Array.isArray(values.message_ids)
    ) {
      cost = values.message_ids.length;
    }
    const deadline = Date.now() + NOTIFICATION_DELIVERY_WAIT_MS;
    // grammY accepts its AbortController polyfill; adapt it for Node timers.
    const controller = new AbortController();
    const abort = () => controller.abort();
    if (signal?.aborted) {
      abort();
    }
    signal?.addEventListener("abort", abort, { once: true });
    try {
      // Negative IDs are groups/channels. Usernames are treated conservatively.
      const privateChat = /^\d+$/.test(String(chat));
      await limiter.acquire({
        key: `${globalKey}:chat:${chat}`,
        intervalMs: privateChat ? chatInterval : groupInterval,
        cost,
        deadline,
        signal: controller.signal,
      });
      await limiter.acquire({
        key: globalKey,
        intervalMs: Math.ceil(1000 / rate),
        cost,
        deadline,
        signal: controller.signal,
      });
      // Paid broadcasts must never be enabled by user-authored templates.
      const response = await previous(
        method,
        { ...payload, allow_paid_broadcast: false },
        signal,
      );
      if (!response.ok && response.error_code === 429) {
        const seconds = Number(response.parameters?.retry_after ?? 60);
        const retryAt = await limiter.pause(
          globalKey,
          Number.isFinite(seconds) ? seconds * 1000 : 60000,
        );
        throw new DeliveryDeferredError(retryAt);
      }
      return response;
    } finally {
      signal?.removeEventListener("abort", abort);
    }
  };
}

export class TelegramBot<C extends Context = Context> extends Bot<C> {
  constructor(...args: ConstructorParameters<typeof Bot<C>>) {
    const options = args[1];
    super(args[0], {
      ...options,
      client: { timeoutSeconds: 30, ...options?.client },
    });
    this.api.config.use(telegramDeliveryRateLimit(args[0]));
  }
}
