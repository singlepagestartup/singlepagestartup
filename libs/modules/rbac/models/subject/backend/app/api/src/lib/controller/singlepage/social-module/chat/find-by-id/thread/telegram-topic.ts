import { TELEGRAM_SERVICE_BOT_TOKEN } from "@sps/shared-utils";
import { IModel as ISocialModuleChat } from "@sps/social/models/chat/sdk/model";

interface ITelegramApiResponse<T> {
  ok: boolean;
  result?: T;
  description?: string;
  error_code?: number;
}

export interface ITelegramForumTopic {
  message_thread_id: number;
  name: string;
  icon_color: number;
  icon_custom_emoji_id?: string;
}

function assertTelegramTopicTitle(title: string) {
  if (title.length > 128) {
    throw new Error(
      "Validation error. Telegram forum topic title must be 128 characters or less",
    );
  }
}

async function telegramApiRequest<T>(props: {
  method: "createForumTopic" | "editForumTopic" | "deleteForumTopic";
  body: Record<string, unknown>;
}): Promise<T> {
  if (!TELEGRAM_SERVICE_BOT_TOKEN) {
    throw new Error(
      "Configuration error. TELEGRAM_SERVICE_BOT_TOKEN is required to sync Telegram topics",
    );
  }

  const response = await fetch(
    `https://api.telegram.org/bot${TELEGRAM_SERVICE_BOT_TOKEN}/${props.method}`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(props.body),
    },
  );
  const payload = (await response.json()) as ITelegramApiResponse<T>;

  if (!response.ok || !payload.ok || !payload.result) {
    throw new Error(
      `Telegram topic sync error. ${payload.description || response.statusText}`,
    );
  }

  return payload.result;
}

export function canMirrorTelegramTopic(props: {
  socialModuleChat: ISocialModuleChat | null | undefined;
}) {
  return Boolean(
    props.socialModuleChat?.variant === "telegram" &&
      props.socialModuleChat.sourceSystemId,
  );
}

export async function createTelegramForumTopic(props: {
  socialModuleChat: ISocialModuleChat;
  title: string;
}) {
  assertTelegramTopicTitle(props.title);

  if (!props.socialModuleChat.sourceSystemId) {
    throw new Error(
      "Validation error. Telegram chat sourceSystemId is required to create a topic",
    );
  }

  const topic = await telegramApiRequest<ITelegramForumTopic>({
    method: "createForumTopic",
    body: {
      chat_id: props.socialModuleChat.sourceSystemId,
      name: props.title,
    },
  });

  if (topic.name !== props.title) {
    await editTelegramForumTopic({
      socialModuleChat: props.socialModuleChat,
      messageThreadId: String(topic.message_thread_id),
      title: props.title,
    });
  }

  return {
    ...topic,
    name: props.title,
  };
}

export async function editTelegramForumTopic(props: {
  socialModuleChat: ISocialModuleChat;
  messageThreadId: string;
  title: string;
}) {
  assertTelegramTopicTitle(props.title);

  if (!props.socialModuleChat.sourceSystemId) {
    throw new Error(
      "Validation error. Telegram chat sourceSystemId is required to edit a topic",
    );
  }

  await telegramApiRequest<boolean>({
    method: "editForumTopic",
    body: {
      chat_id: props.socialModuleChat.sourceSystemId,
      message_thread_id: Number(props.messageThreadId),
      name: props.title,
    },
  });
}

export async function deleteTelegramForumTopic(props: {
  socialModuleChat: ISocialModuleChat;
  messageThreadId: string;
}) {
  if (!props.socialModuleChat.sourceSystemId) {
    throw new Error(
      "Validation error. Telegram chat sourceSystemId is required to delete a topic",
    );
  }

  try {
    await telegramApiRequest<boolean>({
      method: "deleteForumTopic",
      body: {
        chat_id: props.socialModuleChat.sourceSystemId,
        message_thread_id: Number(props.messageThreadId),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const normalizedMessage = message.toLowerCase();

    if (
      normalizedMessage.includes("message thread not found") ||
      normalizedMessage.includes("topic not found")
    ) {
      return false;
    }

    throw error;
  }

  return true;
}
