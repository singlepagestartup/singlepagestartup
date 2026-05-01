import { RBAC_SECRET_KEY, TELEGRAM_SERVICE_BOT_TOKEN } from "@sps/shared-utils";
import { IModel as IRbacSubject } from "@sps/rbac/models/subject/sdk/model";
import { IModel as IRbacIdentity } from "@sps/rbac/models/identity/sdk/model";
import { api as rbacModuleIdentityApi } from "@sps/rbac/models/identity/sdk/server";
import { api } from "@sps/rbac/models/subject/sdk/server";
import { IModel as ISocialModuleProfile } from "@sps/social/models/profile/sdk/model";
import { IModel as ISocialModuleChat } from "@sps/social/models/chat/sdk/model";
import { IModel as ISocialModuleThread } from "@sps/social/models/thread/sdk/model";
import { api as socialModuleProfileApi } from "@sps/social/models/profile/sdk/server";
import { api as socialModuleProfilesToChatsApi } from "@sps/social/relations/profiles-to-chats/sdk/server";
import { api as socialModuleChatApi } from "@sps/social/models/chat/sdk/server";
import { api as socialModuleThreadApi } from "@sps/social/models/thread/sdk/server";
import { api as socialModuleChatsToThreadsApi } from "@sps/social/relations/chats-to-threads/sdk/server";
import { api as socialModuleThreadsToMessagesApi } from "@sps/social/relations/threads-to-messages/sdk/server";
import { api as socialModuleThreadsToActionsApi } from "@sps/social/relations/threads-to-actions/sdk/server";
import { IModel as ISocialModuleAttributeKey } from "@sps/social/models/attribute-key/sdk/model";
import { IModel as ISocialModuleAttribute } from "@sps/social/models/attribute/sdk/model";
import { api as socialModuleAttributeKeyApi } from "@sps/social/models/attribute-key/sdk/server";
import { api as socialModuleAttributeApi } from "@sps/social/models/attribute/sdk/server";
import { api as socialModuleAttributeKeysToAttributesApi } from "@sps/social/relations/attribute-keys-to-attributes/sdk/server";
import { api as socialModuleProfilesToAttributesApi } from "@sps/social/relations/profiles-to-attributes/sdk/server";
import { api as subjectsToIdentitiesApi } from "@sps/rbac/relations/subjects-to-identities/sdk/server";
import { api as subjectsToSocialModuleProfilesApi } from "@sps/rbac/relations/subjects-to-social-module-profiles/sdk/server";
import { IModel as IRbacSubjectsToIdentities } from "@sps/rbac/relations/subjects-to-identities/sdk/model";
import { Service as SubjectsToIdentitiesService } from "@sps/rbac/relations/subjects-to-identities/backend/app/api/src/lib/service";
import { Service as SubjectsToSocialModuleProfilesService } from "@sps/rbac/relations/subjects-to-social-module-profiles/backend/app/api/src/lib/service";
import { type ISocialModule } from "../../../di";
import { Service as IdentityService } from "@sps/rbac/models/identity/backend/app/api/src/lib/service";
import { OpenRouter } from "@sps/shared-third-parties";

export interface IExecuteProps {
  fromId: string;
  chatId: string;
  messageText?: string;
  messageThreadId?: string;
  isTopicMessage?: boolean;
}

export interface IResult {
  rbacModuleSubject: IRbacSubject;
  socialModuleProfile: ISocialModuleProfile;
  socialModuleChat: ISocialModuleChat;
  socialModuleThread: ISocialModuleThread;
  registration: boolean;
  isStartCommand: boolean;
  shouldCheckoutFreeSubscription: boolean;
}

type IFindById = (props: { id: string }) => Promise<IRbacSubject | null>;

export interface IConstructorProps {
  findById: IFindById;
  identity: IdentityService;
  socialModule: ISocialModule;
  subjectsToIdentities: SubjectsToIdentitiesService;
  subjectsToSocialModuleProfiles: SubjectsToSocialModuleProfilesService;
}

export class Service {
  findById: IFindById;
  identity: IdentityService;
  socialModule: ISocialModule;
  subjectsToIdentities: SubjectsToIdentitiesService;
  subjectsToSocialModuleProfiles: SubjectsToSocialModuleProfilesService;

  constructor(props: IConstructorProps) {
    this.findById = props.findById;
    this.identity = props.identity;
    this.socialModule = props.socialModule;
    this.subjectsToIdentities = props.subjectsToIdentities;
    this.subjectsToSocialModuleProfiles = props.subjectsToSocialModuleProfiles;
  }

  private getSdkHeaders() {
    if (!RBAC_SECRET_KEY) {
      throw new Error("Configuration error. RBAC_SECRET_KEY is not set");
    }

    return {
      "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
      "Cache-Control": "no-store",
    };
  }

  private parseStartMessage(messageText?: string) {
    const text = typeof messageText === "string" ? messageText.trim() : "";
    const match = text.match(/^\/start(?:\s+(.+))?$/);
    const referralCode = match?.[1]?.trim() || "";

    return {
      isStartCommand: Boolean(match),
      referralCode,
    };
  }

  private getFallbackTelegramThreadTitle(messageThreadId: string) {
    return `Telegram topic ${messageThreadId}`;
  }

  private isFallbackTelegramThreadTitle(props: {
    title?: string | null;
    messageThreadId: string;
  }) {
    const title = props.title?.trim();

    if (!title) {
      return true;
    }

    return (
      title === "New Chat" ||
      title === this.getFallbackTelegramThreadTitle(props.messageThreadId)
    );
  }

  private shouldGenerateThreadTitleFromMessage(messageText?: string) {
    const text = messageText?.trim();

    if (!text) {
      return false;
    }

    return !text.startsWith("/");
  }

  private getFallbackThreadTitleFromMessage(messageText: string) {
    const words = messageText
      .replace(/\s+/g, " ")
      .trim()
      .split(" ")
      .filter(Boolean)
      .slice(0, 3);

    return `${words.join(" ") || "New thread"} 💬`.slice(0, 128).trim();
  }

  private parseGeneratedThreadTitle(value: string) {
    const cleanValue = value
      .trim()
      .replace(/^```(?:json)?/i, "")
      .replace(/```$/i, "")
      .trim();

    try {
      const parsed = JSON.parse(cleanValue);

      if (parsed && typeof parsed.title === "string") {
        return parsed.title;
      }
    } catch {
      //
    }

    return cleanValue;
  }

  private sanitizeGeneratedThreadTitle(props: {
    generatedTitle?: string;
    messageText: string;
  }) {
    const rawTitle = props.generatedTitle?.trim();
    const fallbackTitle = this.getFallbackThreadTitleFromMessage(
      props.messageText,
    );

    if (!rawTitle) {
      return fallbackTitle;
    }

    const emojiMatch = rawTitle.match(/\p{Extended_Pictographic}/u);
    const emoji = emojiMatch?.[0] || "💬";
    const words = rawTitle
      .replace(/\p{Extended_Pictographic}/gu, " ")
      .replace(/["'`*_~#[\](){}<>]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .split(" ")
      .filter(Boolean)
      .slice(0, 3);

    if (!words.length) {
      return fallbackTitle;
    }

    return `${words.join(" ")} ${emoji}`.slice(0, 128).trim();
  }

  private async generateTelegramThreadTitle(props: { messageText: string }) {
    const fallbackTitle = this.getFallbackThreadTitleFromMessage(
      props.messageText,
    );

    try {
      const openRouter = new OpenRouter();
      const result = await openRouter.generate({
        model: "google/gemini-2.5-flash",
        temperature: 0.2,
        max_tokens: 20,
        responseFormat: {
          type: "json_object",
        },
        context: [
          {
            role: "system",
            content: [
              "Generate a concise Telegram thread title from the user message.",
              "Max 3 words. Include one relevant emoji.",
              "Match message language. Return only JSON:",
              JSON.stringify({ title: "..." }),
            ].join(" "),
          },
          {
            role: "user",
            content: props.messageText.slice(0, 4000),
          },
        ],
      });

      if ("error" in result) {
        return fallbackTitle;
      }

      return this.sanitizeGeneratedThreadTitle({
        generatedTitle: this.parseGeneratedThreadTitle(result.text || ""),
        messageText: props.messageText,
      });
    } catch (error) {
      console.warn("telegram/bootstrap: failed to generate thread title", {
        error: error instanceof Error ? error.message : String(error),
      });

      return fallbackTitle;
    }
  }

  private async editTelegramForumTopicTitle(props: {
    socialModuleChat: ISocialModuleChat;
    messageThreadId: string;
    title: string;
  }) {
    if (!TELEGRAM_SERVICE_BOT_TOKEN || !props.socialModuleChat.sourceSystemId) {
      return;
    }

    const response = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_SERVICE_BOT_TOKEN}/editForumTopic`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          chat_id: props.socialModuleChat.sourceSystemId,
          message_thread_id: Number(props.messageThreadId),
          name: props.title,
        }),
      },
    );
    const payload = await response.json();

    if (!response.ok || !payload?.ok) {
      throw new Error(
        `Telegram topic sync error. ${payload?.description || response.statusText}`,
      );
    }
  }

  private async applyGeneratedTitleToTelegramThread(props: {
    socialModuleChat: ISocialModuleChat;
    socialModuleThread: ISocialModuleThread;
    messageThreadId: string;
    messageText?: string;
    headers: Record<string, string>;
  }) {
    if (
      !this.shouldGenerateThreadTitleFromMessage(props.messageText) ||
      !this.isFallbackTelegramThreadTitle({
        title: props.socialModuleThread.title,
        messageThreadId: props.messageThreadId,
      })
    ) {
      return props.socialModuleThread;
    }

    const title = await this.generateTelegramThreadTitle({
      messageText: props.messageText as string,
    });

    if (!title || title === props.socialModuleThread.title) {
      return props.socialModuleThread;
    }

    const updatedThread = await socialModuleThreadApi.update({
      id: props.socialModuleThread.id,
      data: {
        title,
      },
      options: {
        headers: props.headers,
      },
    });

    try {
      await this.editTelegramForumTopicTitle({
        socialModuleChat: props.socialModuleChat,
        messageThreadId: props.messageThreadId,
        title,
      });
    } catch (error) {
      console.warn("telegram/bootstrap: failed to mirror generated title", {
        threadId: props.socialModuleThread.id,
        messageThreadId: props.messageThreadId,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    return {
      ...props.socialModuleThread,
      ...updatedThread,
    };
  }

  private getCreatedAtTimestamp(value: unknown) {
    if (!value) {
      return Number.MAX_SAFE_INTEGER;
    }

    if (value instanceof Date) {
      return value.getTime();
    }

    const parsed = new Date(String(value)).getTime();

    if (Number.isNaN(parsed)) {
      return Number.MAX_SAFE_INTEGER;
    }

    return parsed;
  }

  private sortThreadsByCreatedAt(threads: ISocialModuleThread[]) {
    return [...threads].sort((a, b) => {
      const timestampDiff =
        this.getCreatedAtTimestamp(a.createdAt) -
        this.getCreatedAtTimestamp(b.createdAt);

      if (timestampDiff !== 0) {
        return timestampDiff;
      }

      return String(a.id).localeCompare(String(b.id));
    });
  }

  private async reconnectDuplicateThreadActionsToPrimary(props: {
    chatId: string;
    primaryThreadId: string;
    duplicateThreadIds: string[];
    headers: Record<string, string>;
  }) {
    if (!props.duplicateThreadIds.length) {
      return;
    }

    const currentChatActions = await this.socialModule.chatsToActions.find({
      params: {
        filters: {
          and: [
            {
              column: "chatId",
              method: "eq",
              value: props.chatId,
            },
          ],
        },
      },
    });
    const currentChatActionIds = new Set(
      currentChatActions
        ?.map((relation: { actionId?: string }) => relation.actionId)
        .filter((actionId: string | undefined): actionId is string =>
          Boolean(actionId),
        ) || [],
    );
    const primaryThreadActions = await this.socialModule.threadsToActions.find({
      params: {
        filters: {
          and: [
            {
              column: "threadId",
              method: "eq",
              value: props.primaryThreadId,
            },
          ],
        },
      },
    });
    const primaryActionIds = new Set(
      primaryThreadActions
        ?.map((relation: { actionId?: string }) => relation.actionId)
        .filter((actionId: string | undefined): actionId is string =>
          Boolean(actionId),
        ) || [],
    );
    const duplicateThreadActions =
      await this.socialModule.threadsToActions.find({
        params: {
          filters: {
            and: [
              {
                column: "threadId",
                method: "inArray",
                value: props.duplicateThreadIds,
              },
            ],
          },
        },
      });

    for (const duplicateThreadAction of duplicateThreadActions || []) {
      const actionId = duplicateThreadAction.actionId;

      if (!actionId) {
        continue;
      }

      if (currentChatActionIds.size && !currentChatActionIds.has(actionId)) {
        continue;
      }

      if (primaryActionIds.has(actionId)) {
        continue;
      }

      await socialModuleThreadsToActionsApi.create({
        data: {
          threadId: props.primaryThreadId,
          actionId,
          variant: duplicateThreadAction.variant || "default",
          orderIndex: duplicateThreadAction.orderIndex ?? 0,
          className: duplicateThreadAction.className || undefined,
        },
        options: {
          headers: props.headers,
        },
      });

      primaryActionIds.add(actionId);
    }
  }

  private async mergeDuplicateDefaultThreadsForChat(props: {
    chatId: string;
    defaultThreads: ISocialModuleThread[];
    chatToThreads: { id?: string; chatId?: string; threadId?: string }[];
    headers: Record<string, string>;
  }) {
    const [primaryThread, ...duplicateThreads] = this.sortThreadsByCreatedAt(
      props.defaultThreads,
    );
    const duplicateThreadIds = duplicateThreads.map((thread) => thread.id);

    if (!duplicateThreadIds.length) {
      return primaryThread;
    }

    const currentChatMessages = await this.socialModule.chatsToMessages.find({
      params: {
        filters: {
          and: [
            {
              column: "chatId",
              method: "eq",
              value: props.chatId,
            },
          ],
        },
      },
    });
    const currentChatMessageIds = new Set(
      currentChatMessages
        ?.map((relation: { messageId?: string }) => relation.messageId)
        .filter((messageId: string | undefined): messageId is string =>
          Boolean(messageId),
        ) || [],
    );
    const primaryThreadMessages =
      await this.socialModule.threadsToMessages.find({
        params: {
          filters: {
            and: [
              {
                column: "threadId",
                method: "eq",
                value: primaryThread.id,
              },
            ],
          },
        },
      });
    const primaryMessageIds = new Set(
      primaryThreadMessages
        ?.map((relation: { messageId?: string }) => relation.messageId)
        .filter((messageId: string | undefined): messageId is string =>
          Boolean(messageId),
        ) || [],
    );
    const duplicateThreadMessages =
      await this.socialModule.threadsToMessages.find({
        params: {
          filters: {
            and: [
              {
                column: "threadId",
                method: "inArray",
                value: duplicateThreadIds,
              },
            ],
          },
        },
      });

    for (const duplicateThreadMessage of duplicateThreadMessages || []) {
      const messageId = duplicateThreadMessage.messageId;

      if (!messageId) {
        continue;
      }

      if (currentChatMessageIds.size && !currentChatMessageIds.has(messageId)) {
        continue;
      }

      if (primaryMessageIds.has(messageId)) {
        continue;
      }

      await socialModuleThreadsToMessagesApi.create({
        data: {
          threadId: primaryThread.id,
          messageId,
          variant: duplicateThreadMessage.variant || "default",
          orderIndex: duplicateThreadMessage.orderIndex ?? 0,
          className: duplicateThreadMessage.className || undefined,
        },
        options: {
          headers: props.headers,
        },
      });

      primaryMessageIds.add(messageId);
    }

    await this.reconnectDuplicateThreadActionsToPrimary({
      chatId: props.chatId,
      primaryThreadId: primaryThread.id,
      duplicateThreadIds,
      headers: props.headers,
    });

    const chatToDuplicateThreadRelations = props.chatToThreads.filter(
      (relation) => {
        return (
          relation.id &&
          relation.chatId === props.chatId &&
          relation.threadId &&
          duplicateThreadIds.includes(relation.threadId)
        );
      },
    );

    for (const relation of chatToDuplicateThreadRelations) {
      await socialModuleChatsToThreadsApi.delete({
        id: relation.id as string,
        options: {
          headers: props.headers,
        },
      });
    }

    const remainingDuplicateThreadLinks =
      await this.socialModule.chatsToThreads.find({
        params: {
          filters: {
            and: [
              {
                column: "threadId",
                method: "inArray",
                value: duplicateThreadIds,
              },
            ],
          },
        },
      });
    const duplicateThreadIdsLinkedElsewhere = new Set(
      remainingDuplicateThreadLinks
        ?.map((relation: { threadId?: string }) => relation.threadId)
        .filter((threadId: string | undefined): threadId is string =>
          Boolean(threadId),
        ) || [],
    );
    const deletedThreadIds: string[] = [];

    for (const duplicateThread of duplicateThreads) {
      if (duplicateThreadIdsLinkedElsewhere.has(duplicateThread.id)) {
        console.warn(
          "telegram/bootstrap: duplicate default thread is still linked to another chat, keeping thread record",
          {
            chatId: props.chatId,
            primaryThreadId: primaryThread.id,
            duplicateThreadId: duplicateThread.id,
          },
        );
        continue;
      }

      await socialModuleThreadApi.delete({
        id: duplicateThread.id,
        options: {
          headers: props.headers,
        },
      });
      deletedThreadIds.push(duplicateThread.id);
    }

    console.warn("telegram/bootstrap: merged duplicate default threads", {
      chatId: props.chatId,
      primaryThreadId: primaryThread.id,
      duplicateThreadIds,
      deletedThreadIds,
    });

    return primaryThread;
  }

  private async mergeDuplicateTelegramTopicThreadsForChat(props: {
    chatId: string;
    messageThreadId: string;
    topicThreads: ISocialModuleThread[];
    chatToThreads: { id?: string; chatId?: string; threadId?: string }[];
    headers: Record<string, string>;
  }) {
    const [primaryThread, ...duplicateThreads] = this.sortThreadsByCreatedAt(
      props.topicThreads,
    );
    const duplicateThreadIds = duplicateThreads.map((thread) => thread.id);

    if (!duplicateThreadIds.length) {
      return primaryThread;
    }

    const currentChatMessages = await this.socialModule.chatsToMessages.find({
      params: {
        filters: {
          and: [
            {
              column: "chatId",
              method: "eq",
              value: props.chatId,
            },
          ],
        },
      },
    });
    const currentChatMessageIds = new Set(
      currentChatMessages
        ?.map((relation: { messageId?: string }) => relation.messageId)
        .filter((messageId: string | undefined): messageId is string =>
          Boolean(messageId),
        ) || [],
    );
    const primaryThreadMessages =
      await this.socialModule.threadsToMessages.find({
        params: {
          filters: {
            and: [
              {
                column: "threadId",
                method: "eq",
                value: primaryThread.id,
              },
            ],
          },
        },
      });
    const primaryMessageIds = new Set(
      primaryThreadMessages
        ?.map((relation: { messageId?: string }) => relation.messageId)
        .filter((messageId: string | undefined): messageId is string =>
          Boolean(messageId),
        ) || [],
    );
    const duplicateThreadMessages =
      await this.socialModule.threadsToMessages.find({
        params: {
          filters: {
            and: [
              {
                column: "threadId",
                method: "inArray",
                value: duplicateThreadIds,
              },
            ],
          },
        },
      });

    for (const duplicateThreadMessage of duplicateThreadMessages || []) {
      const messageId = duplicateThreadMessage.messageId;

      if (!messageId) {
        continue;
      }

      if (currentChatMessageIds.size && !currentChatMessageIds.has(messageId)) {
        continue;
      }

      if (primaryMessageIds.has(messageId)) {
        continue;
      }

      await socialModuleThreadsToMessagesApi.create({
        data: {
          threadId: primaryThread.id,
          messageId,
          variant: duplicateThreadMessage.variant || "default",
          orderIndex: duplicateThreadMessage.orderIndex ?? 0,
          className: duplicateThreadMessage.className || undefined,
        },
        options: {
          headers: props.headers,
        },
      });

      primaryMessageIds.add(messageId);
    }

    await this.reconnectDuplicateThreadActionsToPrimary({
      chatId: props.chatId,
      primaryThreadId: primaryThread.id,
      duplicateThreadIds,
      headers: props.headers,
    });

    const chatToDuplicateThreadRelations = props.chatToThreads.filter(
      (relation) => {
        return (
          relation.id &&
          relation.chatId === props.chatId &&
          relation.threadId &&
          duplicateThreadIds.includes(relation.threadId)
        );
      },
    );

    for (const relation of chatToDuplicateThreadRelations) {
      await socialModuleChatsToThreadsApi.delete({
        id: relation.id as string,
        options: {
          headers: props.headers,
        },
      });
    }

    const remainingDuplicateThreadLinks =
      await this.socialModule.chatsToThreads.find({
        params: {
          filters: {
            and: [
              {
                column: "threadId",
                method: "inArray",
                value: duplicateThreadIds,
              },
            ],
          },
        },
      });
    const duplicateThreadIdsLinkedElsewhere = new Set(
      remainingDuplicateThreadLinks
        ?.map((relation: { threadId?: string }) => relation.threadId)
        .filter((threadId: string | undefined): threadId is string =>
          Boolean(threadId),
        ) || [],
    );
    const deletedThreadIds: string[] = [];

    for (const duplicateThread of duplicateThreads) {
      if (duplicateThreadIdsLinkedElsewhere.has(duplicateThread.id)) {
        console.warn(
          "telegram/bootstrap: duplicate Telegram topic thread is still linked to another chat, keeping thread record",
          {
            chatId: props.chatId,
            messageThreadId: props.messageThreadId,
            primaryThreadId: primaryThread.id,
            duplicateThreadId: duplicateThread.id,
          },
        );
        continue;
      }

      await socialModuleThreadApi.delete({
        id: duplicateThread.id,
        options: {
          headers: props.headers,
        },
      });
      deletedThreadIds.push(duplicateThread.id);
    }

    console.warn(
      "telegram/bootstrap: merged duplicate Telegram topic threads",
      {
        chatId: props.chatId,
        messageThreadId: props.messageThreadId,
        primaryThreadId: primaryThread.id,
        duplicateThreadIds,
        deletedThreadIds,
      },
    );

    return primaryThread;
  }

  private async ensureDefaultThreadForChat(props: {
    chatId: string;
    headers: Record<string, string>;
  }): Promise<ISocialModuleThread> {
    const chatToThreads = await this.socialModule.chatsToThreads.find({
      params: {
        filters: {
          and: [
            {
              column: "chatId",
              method: "eq",
              value: props.chatId,
            },
          ],
        },
      },
    });

    const threadIds =
      chatToThreads
        ?.map((chatToThread: { threadId?: string }) => chatToThread.threadId)
        .filter((threadId: string | undefined): threadId is string =>
          Boolean(threadId),
        ) || [];

    if (threadIds.length) {
      const threads = await this.socialModule.thread.find({
        params: {
          filters: {
            and: [
              {
                column: "id",
                method: "inArray",
                value: threadIds,
              },
            ],
          },
        },
      });

      const defaultThreads =
        threads?.filter((thread: ISocialModuleThread) => {
          return thread.variant === "default";
        }) || [];

      if (defaultThreads.length > 1) {
        return this.mergeDuplicateDefaultThreadsForChat({
          chatId: props.chatId,
          defaultThreads,
          chatToThreads: chatToThreads || [],
          headers: props.headers,
        });
      }

      if (defaultThreads.length === 1) {
        return defaultThreads[0];
      }
    }

    const thread = await socialModuleThreadApi.create({
      data: {
        variant: "default",
        title: "Default thread",
      },
      options: {
        headers: props.headers,
      },
    });

    await socialModuleChatsToThreadsApi.create({
      data: {
        chatId: props.chatId,
        threadId: thread.id,
        variant: "default",
      },
      options: {
        headers: props.headers,
      },
    });

    return thread;
  }

  private async resolveThreadForTelegramMessage(props: {
    socialModuleChat: ISocialModuleChat;
    chatId: string;
    messageThreadId?: string;
    messageText?: string;
    headers: Record<string, string>;
  }): Promise<ISocialModuleThread> {
    const messageThreadId = props.messageThreadId?.trim();

    if (!messageThreadId) {
      return this.ensureDefaultThreadForChat({
        chatId: props.chatId,
        headers: props.headers,
      });
    }

    const chatToThreads = await this.socialModule.chatsToThreads.find({
      params: {
        filters: {
          and: [
            {
              column: "chatId",
              method: "eq",
              value: props.chatId,
            },
          ],
        },
      },
    });

    const threadIds =
      chatToThreads
        ?.map((chatToThread: { threadId?: string }) => chatToThread.threadId)
        .filter((threadId: string | undefined): threadId is string =>
          Boolean(threadId),
        ) || [];

    if (threadIds.length) {
      const threads = await this.socialModule.thread.find({
        params: {
          filters: {
            and: [
              {
                column: "id",
                method: "inArray",
                value: threadIds,
              },
              {
                column: "sourceSystemId",
                method: "eq",
                value: messageThreadId,
              },
            ],
          },
        },
      });

      if (threads?.length) {
        const thread =
          threads.length > 1
            ? await this.mergeDuplicateTelegramTopicThreadsForChat({
                chatId: props.chatId,
                messageThreadId,
                topicThreads: threads,
                chatToThreads: chatToThreads || [],
                headers: props.headers,
              })
            : (threads[0] as ISocialModuleThread);

        return this.applyGeneratedTitleToTelegramThread({
          socialModuleChat: props.socialModuleChat,
          socialModuleThread: thread,
          messageThreadId,
          messageText: props.messageText,
          headers: props.headers,
        });
      }
    }

    const title = this.getFallbackTelegramThreadTitle(messageThreadId);
    const thread = await socialModuleThreadApi.create({
      data: {
        variant: "telegram",
        title,
        sourceSystemId: messageThreadId,
      },
      options: {
        headers: props.headers,
      },
    });

    await socialModuleChatsToThreadsApi.create({
      data: {
        chatId: props.chatId,
        threadId: thread.id,
      },
      options: {
        headers: props.headers,
      },
    });

    return this.applyGeneratedTitleToTelegramThread({
      socialModuleChat: props.socialModuleChat,
      socialModuleThread: thread,
      messageThreadId,
      messageText: props.messageText,
      headers: props.headers,
    });
  }

  private async resolveSubjectByIdentityLinks(props: {
    identityId: string;
    links: IRbacSubjectsToIdentities[];
  }) {
    const links = [...props.links].sort(
      (a, b) =>
        this.getCreatedAtTimestamp(a.createdAt) -
        this.getCreatedAtTimestamp(b.createdAt),
    );

    let selectedSubject: IRbacSubject | null = null;
    const duplicateLinkIds: string[] = [];

    for (const link of links) {
      const existingSubject = await this.findById({
        id: link.subjectId,
      });

      if (!selectedSubject && existingSubject) {
        selectedSubject = existingSubject;
        continue;
      }

      duplicateLinkIds.push(link.id);
    }

    for (const duplicateLinkId of duplicateLinkIds) {
      await subjectsToIdentitiesApi.delete({
        id: duplicateLinkId,
        options: {
          headers: this.getSdkHeaders(),
        },
      });
    }

    if (duplicateLinkIds.length) {
      console.warn(
        "telegram/bootstrap: removed duplicate subjects-to-identities links",
        {
          identityId: props.identityId,
          removedLinks: duplicateLinkIds,
        },
      );
    }

    if (!selectedSubject) {
      throw new Error(
        "Internal error. Subject not found for the given identity links",
      );
    }

    return selectedSubject;
  }

  private async resolveIdentityDuplicates(props: {
    account: string;
    provider: string;
    identities: IRbacIdentity[];
    headers: Record<string, string>;
  }) {
    const identities = [...props.identities].sort(
      (a, b) =>
        this.getCreatedAtTimestamp(a.createdAt) -
        this.getCreatedAtTimestamp(b.createdAt),
    );

    const linksByIdentity = new Map<string, IRbacSubjectsToIdentities[]>();

    for (const identity of identities) {
      const links = await this.subjectsToIdentities.find({
        params: {
          filters: {
            and: [
              {
                column: "identityId",
                method: "eq",
                value: identity.id,
              },
            ],
          },
        },
      });

      linksByIdentity.set(identity.id, links ?? []);
    }

    let selectedIdentity = identities[0];

    for (const identity of identities) {
      const links = linksByIdentity.get(identity.id) ?? [];

      if (links.length) {
        selectedIdentity = identity;
        break;
      }
    }

    const selectedLinks = linksByIdentity.get(selectedIdentity.id) ?? [];
    const selectedSubjectIds = new Set(
      selectedLinks.map((link) => link.subjectId),
    );
    const mergedIdentityIds: string[] = [];

    for (const identity of identities) {
      if (identity.id === selectedIdentity.id) {
        continue;
      }

      const identityLinks = linksByIdentity.get(identity.id) ?? [];

      for (const link of identityLinks) {
        if (selectedSubjectIds.has(link.subjectId)) {
          continue;
        }

        await subjectsToIdentitiesApi.create({
          data: {
            subjectId: link.subjectId,
            identityId: selectedIdentity.id,
          },
          options: {
            headers: props.headers,
          },
        });

        selectedSubjectIds.add(link.subjectId);
      }

      await rbacModuleIdentityApi.delete({
        id: identity.id,
        options: {
          headers: props.headers,
        },
      });

      mergedIdentityIds.push(identity.id);
    }

    if (mergedIdentityIds.length) {
      console.warn("telegram/bootstrap: merged duplicate identities", {
        account: props.account,
        provider: props.provider,
        selectedIdentityId: selectedIdentity.id,
        removedIdentityIds: mergedIdentityIds,
      });
    }

    return selectedIdentity;
  }

  async execute(props: IExecuteProps): Promise<IResult> {
    if (!props.fromId) {
      throw new Error("Validation error. 'fromId' is required");
    }

    if (!props.chatId) {
      throw new Error("Validation error. 'chatId' is required");
    }

    const headers = this.getSdkHeaders();
    let registration = false;
    let subject: IRbacSubject | null = null;
    let profile: ISocialModuleProfile | null = null;
    let chat: ISocialModuleChat | null = null;

    const identities = await this.identity.find({
      params: {
        filters: {
          and: [
            {
              column: "account",
              method: "eq",
              value: props.fromId,
            },
            {
              column: "provider",
              method: "eq",
              value: "telegram",
            },
          ],
        },
      },
    });

    if (identities?.length) {
      const identity =
        identities.length > 1
          ? await this.resolveIdentityDuplicates({
              account: props.fromId,
              provider: "telegram",
              identities,
              headers,
            })
          : identities[0];
      const subjectsToIdentities = await this.subjectsToIdentities.find({
        params: {
          filters: {
            and: [
              {
                column: "identityId",
                method: "eq",
                value: identity.id,
              },
            ],
          },
        },
      });

      if (subjectsToIdentities?.length) {
        subject = await this.resolveSubjectByIdentityLinks({
          identityId: identity.id,
          links: subjectsToIdentities,
        });
      } else {
        subject = await api.create({
          data: {},
          options: { headers },
        });

        await subjectsToIdentitiesApi.create({
          data: {
            subjectId: subject.id,
            identityId: identity.id,
          },
          options: { headers },
        });
      }
    } else {
      const identity = await rbacModuleIdentityApi.create({
        data: {
          account: props.fromId,
          provider: "telegram",
        },
        options: { headers },
      });

      subject = await api.create({
        data: {},
        options: { headers },
      });

      await subjectsToIdentitiesApi.create({
        data: {
          subjectId: subject.id,
          identityId: identity.id,
        },
        options: { headers },
      });

      registration = true;
    }

    const subjectToProfiles = await this.subjectsToSocialModuleProfiles.find({
      params: {
        filters: {
          and: [
            {
              column: "subjectId",
              method: "eq",
              value: subject.id,
            },
          ],
        },
      },
    });

    if (subjectToProfiles?.length) {
      const socialModuleProfiles = await this.socialModule.profile.find({
        params: {
          filters: {
            and: [
              {
                column: "id",
                method: "inArray",
                value: subjectToProfiles.map(
                  (item) => item.socialModuleProfileId,
                ),
              },
              {
                column: "variant",
                method: "eq",
                value: "telegram",
              },
            ],
          },
        },
      });

      if (socialModuleProfiles?.length) {
        const sortedProfiles = [...socialModuleProfiles].sort(
          (a, b) =>
            this.getCreatedAtTimestamp(a.createdAt) -
            this.getCreatedAtTimestamp(b.createdAt),
        );

        profile = sortedProfiles[0];

        const duplicateProfiles = sortedProfiles.slice(1);

        if (duplicateProfiles.length) {
          const removedProfileIds: string[] = [];
          const removedLinkIds: string[] = [];

          for (const duplicateProfile of duplicateProfiles) {
            const duplicateLinks = subjectToProfiles.filter((link) => {
              return link.socialModuleProfileId === duplicateProfile.id;
            });

            for (const duplicateLink of duplicateLinks) {
              await subjectsToSocialModuleProfilesApi.delete({
                id: duplicateLink.id,
                options: { headers },
              });
              removedLinkIds.push(duplicateLink.id);
            }

            try {
              await socialModuleProfileApi.delete({
                id: duplicateProfile.id,
                options: { headers },
              });
              removedProfileIds.push(duplicateProfile.id);
            } catch (error) {
              console.warn(
                "telegram/bootstrap: failed to delete duplicate profile",
                {
                  profileId: duplicateProfile.id,
                  subjectId: subject.id,
                },
              );
            }
          }

          if (removedProfileIds.length || removedLinkIds.length) {
            console.warn("telegram/bootstrap: removed duplicate profiles", {
              subjectId: subject.id,
              keptProfileId: sortedProfiles[0].id,
              removedProfileIds,
              removedLinkIds,
            });
          }
        }
      } else {
        profile = await socialModuleProfileApi.create({
          data: {
            variant: "telegram",
          },
          options: { headers },
        });

        await subjectsToSocialModuleProfilesApi.create({
          data: {
            subjectId: subject.id,
            socialModuleProfileId: profile.id,
          },
          options: { headers },
        });
      }
    } else {
      profile = await socialModuleProfileApi.create({
        data: {
          variant: "telegram",
        },
        options: { headers },
      });

      await subjectsToSocialModuleProfilesApi.create({
        data: {
          subjectId: subject.id,
          socialModuleProfileId: profile.id,
        },
        options: { headers },
      });
    }

    if (!profile) {
      throw new Error(
        "Internal error. Social module profile not initialized for subject",
      );
    }

    const { isStartCommand, referralCode } = this.parseStartMessage(
      props.messageText,
    );

    if (isStartCommand && referralCode) {
      let socialModuleReferrerAttributeKey: ISocialModuleAttributeKey;

      const socialModuleAttributeKeys =
        await this.socialModule.attributeKey.find({
          params: {
            filters: {
              and: [
                {
                  column: "slug",
                  method: "eq",
                  value: "referrer",
                },
              ],
            },
          },
        });

      if (socialModuleAttributeKeys?.length) {
        socialModuleReferrerAttributeKey = socialModuleAttributeKeys[0];
      } else {
        socialModuleReferrerAttributeKey =
          await socialModuleAttributeKeyApi.create({
            data: {
              adminTitle: "Referrer",
              title: {
                ru: "Реферрер",
                en: "Referrer",
              },
              slug: "referrer",
            },
            options: { headers },
          });
      }

      let socialModuleReferrerAttribute: ISocialModuleAttribute;

      const socialModuleAttributes = await this.socialModule.attribute.find({
        params: {
          filters: {
            and: [
              {
                column: "slug",
                method: "eq",
                value: `${profile.id}-invitedby-${referralCode}`,
              },
            ],
          },
        },
      });

      if (socialModuleAttributes?.length) {
        socialModuleReferrerAttribute = socialModuleAttributes[0];
      } else {
        socialModuleReferrerAttribute = await socialModuleAttributeApi.create({
          data: {
            adminTitle: `${profile.id} | Referral Code | ${referralCode}`,
            string: {
              ru: referralCode,
              en: referralCode,
            },
            slug: `${profile.id}-invitedby-${referralCode}`,
          },
          options: { headers },
        });
      }

      const socialModuleAttributeKeysToAttributes =
        await this.socialModule.attributeKeysToAttributes.find({
          params: {
            filters: {
              and: [
                {
                  column: "attributeKeyId",
                  method: "eq",
                  value: socialModuleReferrerAttributeKey.id,
                },
                {
                  column: "attributeId",
                  method: "eq",
                  value: socialModuleReferrerAttribute.id,
                },
              ],
            },
          },
        });

      if (!socialModuleAttributeKeysToAttributes?.length) {
        await socialModuleAttributeKeysToAttributesApi.create({
          data: {
            attributeKeyId: socialModuleReferrerAttributeKey.id,
            attributeId: socialModuleReferrerAttribute.id,
          },
          options: { headers },
        });
      }

      const socialModuleProfilesToAttributes =
        await this.socialModule.profilesToAttributes.find({
          params: {
            filters: {
              and: [
                {
                  column: "profileId",
                  method: "eq",
                  value: profile.id,
                },
                {
                  column: "attributeId",
                  method: "eq",
                  value: socialModuleReferrerAttribute.id,
                },
              ],
            },
          },
        });

      if (!socialModuleProfilesToAttributes?.length) {
        await socialModuleProfilesToAttributesApi.create({
          data: {
            profileId: profile.id,
            attributeId: socialModuleReferrerAttribute.id,
          },
          options: { headers },
        });
      }
    }

    const socialModuleProfilesToChats =
      await this.socialModule.profilesToChats.find({
        params: {
          filters: {
            and: [
              {
                column: "profileId",
                method: "eq",
                value: profile.id,
              },
            ],
          },
        },
      });

    if (!socialModuleProfilesToChats?.length) {
      chat = await socialModuleChatApi.create({
        data: {
          variant: "telegram",
          sourceSystemId: props.chatId,
        },
        options: { headers },
      });

      await socialModuleProfilesToChatsApi.create({
        data: {
          profileId: profile.id,
          chatId: chat.id,
        },
        options: { headers },
      });
    } else {
      const socialModuleChats = await this.socialModule.chat.find({
        params: {
          filters: {
            and: [
              {
                column: "id",
                method: "inArray",
                value: socialModuleProfilesToChats.map((item) => item.chatId),
              },
              {
                column: "variant",
                method: "eq",
                value: "telegram",
              },
              {
                column: "sourceSystemId",
                method: "eq",
                value: props.chatId,
              },
            ],
          },
        },
      });

      if (socialModuleChats?.length) {
        if (socialModuleChats.length > 1) {
          throw new Error(
            "Internal error. Multiple social module chats found for the same profile",
          );
        }

        chat = socialModuleChats[0];
      } else {
        chat = await socialModuleChatApi.create({
          data: {
            variant: "telegram",
            sourceSystemId: props.chatId,
          },
          options: { headers },
        });

        await socialModuleProfilesToChatsApi.create({
          data: {
            profileId: profile.id,
            chatId: chat.id,
          },
          options: { headers },
        });
      }
    }

    if (!chat) {
      throw new Error(
        "Internal error. Social module chat not initialized for profile",
      );
    }

    const telegramBotAgentSocialModuleProfiles =
      await this.socialModule.profile.find({
        params: {
          filters: {
            and: [
              {
                column: "variant",
                method: "inArray",
                value: ["agent", "artificial-intelligence"],
              },
            ],
          },
        },
      });

    if (telegramBotAgentSocialModuleProfiles?.length) {
      const existingProfileToChats =
        await this.socialModule.profilesToChats.find({
          params: {
            filters: {
              and: [
                {
                  column: "chatId",
                  method: "eq",
                  value: chat.id,
                },
              ],
            },
          },
        });

      if (existingProfileToChats?.length) {
        for (const agentProfile of telegramBotAgentSocialModuleProfiles) {
          const exists = existingProfileToChats.find(
            (profileToChat) => profileToChat.profileId === agentProfile.id,
          );

          if (!exists) {
            await socialModuleProfilesToChatsApi.create({
              data: {
                profileId: agentProfile.id,
                chatId: chat.id,
              },
              options: { headers },
            });
          }
        }
      }
    }

    const thread = await this.resolveThreadForTelegramMessage({
      socialModuleChat: chat,
      chatId: chat.id,
      messageThreadId: props.messageThreadId,
      messageText: props.messageText,
      headers,
    });

    return {
      rbacModuleSubject: subject,
      socialModuleProfile: profile,
      socialModuleChat: chat,
      socialModuleThread: thread,
      registration,
      isStartCommand,
      shouldCheckoutFreeSubscription: registration || isStartCommand,
    };
  }
}
