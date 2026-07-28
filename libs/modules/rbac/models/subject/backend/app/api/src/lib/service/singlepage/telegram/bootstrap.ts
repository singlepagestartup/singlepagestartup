import { RBAC_SECRET_KEY, TELEGRAM_SERVICE_BOT_TOKEN } from "@sps/shared-utils";
import { IModel as IRbacSubject } from "@sps/rbac/models/subject/sdk/model";
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
import { IModel as ISocialModuleAttributeKey } from "@sps/social/models/attribute-key/sdk/model";
import { IModel as ISocialModuleAttribute } from "@sps/social/models/attribute/sdk/model";
import { api as socialModuleAttributeKeyApi } from "@sps/social/models/attribute-key/sdk/server";
import { api as socialModuleAttributeApi } from "@sps/social/models/attribute/sdk/server";
import { api as socialModuleAttributeKeysToAttributesApi } from "@sps/social/relations/attribute-keys-to-attributes/sdk/server";
import { api as socialModuleProfilesToAttributesApi } from "@sps/social/relations/profiles-to-attributes/sdk/server";
import { api as subjectsToIdentitiesApi } from "@sps/rbac/relations/subjects-to-identities/sdk/server";
import { api as subjectsToSocialModuleProfilesApi } from "@sps/rbac/relations/subjects-to-social-module-profiles/sdk/server";
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
  personalAiRbacModuleSubject: IRbacSubject;
  socialModuleProfile: ISocialModuleProfile;
  personalAiSocialModuleProfile: ISocialModuleProfile;
  socialModuleChat: ISocialModuleChat;
  socialModuleThread: ISocialModuleThread;
  registration: boolean;
  isStartCommand: boolean;
  shouldCheckoutFreeSubscription: boolean;
}

type IFindById = (props: { id: string }) => Promise<IRbacSubject | null>;
type IResolvePersonalAiAgent = (props: {
  ownerRbacSubject: IRbacSubject;
  socialModuleChatId: string;
}) => Promise<{
  rbacModuleSubject: IRbacSubject;
  socialModuleProfile: ISocialModuleProfile;
}>;
type IEnsureProfileManagementAccess = (props: {
  ownerRbacSubjectId: string;
  socialModuleProfileId: string;
}) => Promise<unknown>;

export interface IConstructorProps {
  findById: IFindById;
  identity: IdentityService;
  socialModule: ISocialModule;
  subjectsToIdentities: SubjectsToIdentitiesService;
  subjectsToSocialModuleProfiles: SubjectsToSocialModuleProfilesService;
  resolvePersonalAiAgent?: IResolvePersonalAiAgent;
  ensureProfileManagementAccess?: IEnsureProfileManagementAccess;
}

export class Service {
  findById: IFindById;
  identity: IdentityService;
  socialModule: ISocialModule;
  subjectsToIdentities: SubjectsToIdentitiesService;
  subjectsToSocialModuleProfiles: SubjectsToSocialModuleProfilesService;
  resolvePersonalAiAgent: IResolvePersonalAiAgent;
  ensureProfileManagementAccess: IEnsureProfileManagementAccess;

  constructor(props: IConstructorProps) {
    this.findById = props.findById;
    this.identity = props.identity;
    this.socialModule = props.socialModule;
    this.subjectsToIdentities = props.subjectsToIdentities;
    this.subjectsToSocialModuleProfiles = props.subjectsToSocialModuleProfiles;
    this.resolvePersonalAiAgent =
      props.resolvePersonalAiAgent ||
      (async () => {
        throw new Error(
          "Configuration error. Telegram personal AI agent resolver is not configured.",
        );
      });
    this.ensureProfileManagementAccess =
      props.ensureProfileManagementAccess || (async () => undefined);
  }

  protected getSdkHeaders() {
    if (!RBAC_SECRET_KEY) {
      throw new Error("Configuration error. RBAC_SECRET_KEY is not set");
    }

    return {
      "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
      "Cache-Control": "no-store",
    };
  }

  protected parseStartMessage(messageText?: string) {
    const text = typeof messageText === "string" ? messageText.trim() : "";
    const match = text.match(/^\/start(?:\s+(.+))?$/);
    const referralCode = match?.[1]?.trim() || "";

    return {
      isStartCommand: Boolean(match),
      referralCode,
    };
  }

  protected getFallbackTelegramThreadTitle(messageThreadId: string) {
    return `Telegram topic ${messageThreadId}`;
  }

  protected isFallbackTelegramThreadTitle(props: {
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

  protected getTelegramThreadTitleSourceFromMessage(messageText?: string) {
    const text = messageText?.trim();

    if (!text) {
      return;
    }

    const knowledgeCommand = text.match(
      /^\/(?:knowledge|learn)(?:@[a-z0-9_]+)?(?:\s+([\s\S]+))?$/i,
    );

    if (knowledgeCommand) {
      return knowledgeCommand[1]?.trim() || undefined;
    }

    if (text.startsWith("/")) {
      return;
    }

    return text;
  }

  protected getFallbackThreadTitleFromMessage(messageText: string) {
    const words = messageText
      .replace(/\s+/g, " ")
      .trim()
      .split(" ")
      .filter(Boolean)
      .slice(0, 3);

    return `${words.join(" ") || "New thread"} 💬`.slice(0, 128).trim();
  }

  protected stripGeneratedThreadTitleFieldLabel(value: string) {
    return value.replace(/^['"]?title['"]?\s*:\s*/i, "").trim();
  }

  protected parseGeneratedThreadTitle(value: string) {
    const cleanValue = value
      .trim()
      .replace(/^```(?:json)?/i, "")
      .replace(/```$/i, "")
      .trim();
    let parsedTitle = cleanValue;

    try {
      const parsed = JSON.parse(cleanValue);

      if (parsed && typeof parsed.title === "string") {
        parsedTitle = parsed.title;
      }
    } catch {
      //
    }

    return this.stripGeneratedThreadTitleFieldLabel(parsedTitle);
  }

  protected sanitizeGeneratedThreadTitle(props: {
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

  protected async generateTelegramThreadTitle(props: { messageText: string }) {
    const fallbackTitle = this.getFallbackThreadTitleFromMessage(
      props.messageText,
    );

    try {
      const openRouter = new OpenRouter();
      const result = await openRouter.generate({
        model: "openai/gpt-5.6-terra",
        max_tokens: 100,
        responseFormat: {
          type: "json_schema",
          json_schema: {
            name: "telegram_thread_title",
            strict: true,
            schema: {
              type: "object",
              properties: {
                title: {
                  type: "string",
                  minLength: 1,
                  maxLength: 100,
                },
              },
              required: ["title"],
              additionalProperties: false,
            },
          },
        },
        context: [
          {
            role: "system",
            content: [
              "Create a concise Telegram thread title that describes the user's topic or intent.",
              "Use 1 to 3 meaningful, complete words in the user's language, followed by one relevant emoji.",
              "Do not copy conversational prefixes or include labels such as title.",
              `Example: ${JSON.stringify({
                message: "Расскажи что ты умеешь?",
                title: "Возможности ассистента 🤖",
              })}.`,
              "Return only the requested structured object.",
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

  protected async editTelegramForumTopicTitle(props: {
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

  protected async applyGeneratedTitleToTelegramThread(props: {
    socialModuleChat: ISocialModuleChat;
    socialModuleThread: ISocialModuleThread;
    messageThreadId: string;
    messageText?: string;
    headers: Record<string, string>;
  }) {
    const currentTitle = props.socialModuleThread.title?.trim() || "";
    const repairedTitle =
      this.stripGeneratedThreadTitleFieldLabel(currentTitle);
    const shouldRepairTitle = Boolean(
      repairedTitle && repairedTitle !== currentTitle,
    );
    const titleSourceText = this.getTelegramThreadTitleSourceFromMessage(
      props.messageText,
    );

    if (
      !shouldRepairTitle &&
      (!titleSourceText ||
        !this.isFallbackTelegramThreadTitle({
          title: props.socialModuleThread.title,
          messageThreadId: props.messageThreadId,
        }))
    ) {
      return props.socialModuleThread;
    }

    const title = shouldRepairTitle
      ? repairedTitle.slice(0, 128).trim()
      : await this.generateTelegramThreadTitle({
          messageText: titleSourceText as string,
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

  protected async findTelegramChats(chatId: string) {
    return ((await this.socialModule.chat.find({
      params: {
        filters: {
          and: [
            {
              column: "variant",
              method: "eq",
              value: "telegram",
            },
            {
              column: "sourceSystemId",
              method: "eq",
              value: chatId,
            },
          ],
        },
      },
    })) || []) as ISocialModuleChat[];
  }

  protected async resolveTelegramChat(props: {
    chatId: string;
    profileId: string;
    headers: Record<string, string>;
  }): Promise<ISocialModuleChat> {
    let chats = await this.findTelegramChats(props.chatId);

    if (!chats.length) {
      const createdChat = await socialModuleChatApi.create({
        data: {
          variant: "telegram",
          sourceSystemId: props.chatId,
          slug: `telegram-chat-${props.chatId}`,
        },
        options: { headers: props.headers },
      });
      chats = [createdChat];
    }

    if (chats.length > 1) {
      throw new Error(
        "Data integrity error. Multiple Telegram chats found for one source id",
      );
    }

    const chat = chats[0];
    const profileLinks = await this.socialModule.profilesToChats.find({
      params: {
        filters: {
          and: [
            {
              column: "profileId",
              method: "eq",
              value: props.profileId,
            },
            {
              column: "chatId",
              method: "eq",
              value: chat.id,
            },
          ],
        },
      },
    });

    if (!profileLinks?.length) {
      await socialModuleProfilesToChatsApi.create({
        data: {
          profileId: props.profileId,
          chatId: chat.id,
        },
        options: { headers: props.headers },
      });
    }

    return chat;
  }

  protected async ensureDefaultThreadForChat(props: {
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
        throw new Error(
          "Data integrity error. Multiple default threads found for one chat",
        );
      }

      if (defaultThreads.length === 1) {
        return defaultThreads[0];
      }
    }

    const thread = await socialModuleThreadApi.create({
      data: {
        variant: "default",
        title: "Default thread",
        slug: `telegram-thread-${props.chatId}-default`,
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

  protected async resolveThreadForTelegramMessage(props: {
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
        if (threads.length > 1) {
          throw new Error(
            "Data integrity error. Multiple Telegram topic threads found for one chat",
          );
        }

        const thread = threads[0] as ISocialModuleThread;

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
        slug: `telegram-thread-${props.chatId}-${messageThreadId}`,
      },
      options: {
        headers: props.headers,
      },
    });

    await socialModuleChatsToThreadsApi.create({
      data: {
        chatId: props.chatId,
        threadId: thread.id,
        variant: "telegram",
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

  protected async ensureTelegramAutomaticProfilesForChat(props: {
    ownerRbacSubjectId?: string;
    socialModuleChatId: string;
    personalAiSocialModuleProfile: ISocialModuleProfile;
    headers: Record<string, string>;
  }) {
    const [existingRelations, telegramBotProfiles] = await Promise.all([
      this.socialModule.profilesToChats.find({
        params: {
          filters: {
            and: [
              {
                column: "chatId",
                method: "eq",
                value: props.socialModuleChatId,
              },
            ],
          },
        },
      }),
      this.socialModule.profile.find({
        params: {
          filters: {
            and: [
              {
                column: "slug",
                method: "eq",
                value: "telegram-bot",
              },
              {
                column: "variant",
                method: "eq",
                value: "agent",
              },
            ],
          },
          limit: 2,
        },
      }),
    ]);
    const telegramBotProfile = telegramBotProfiles?.[0] as
      | ISocialModuleProfile
      | undefined;

    if ((telegramBotProfiles?.length || 0) > 1) {
      throw new Error(
        "Data integrity error. Multiple telegram-bot social profiles found",
      );
    }

    if (!telegramBotProfile) {
      console.warn(
        "telegram/bootstrap: telegram-bot system social.profile was not found",
        {
          socialModuleChatId: props.socialModuleChatId,
        },
      );
    }

    const requiredProfiles = [
      props.personalAiSocialModuleProfile,
      ...(telegramBotProfile ? [telegramBotProfile] : []),
    ];

    for (const requiredProfile of requiredProfiles) {
      const isConnected = existingRelations?.some(
        (relation) => relation.profileId === requiredProfile.id,
      );

      if (!isConnected) {
        await socialModuleProfilesToChatsApi.create({
          data: {
            profileId: requiredProfile.id,
            chatId: props.socialModuleChatId,
            variant:
              requiredProfile.id === props.personalAiSocialModuleProfile.id
                ? "telegram-personal-ai-agent"
                : "telegram-system-agent",
          },
          options: {
            headers: props.headers,
          },
        });
      }
    }

    if (!props.ownerRbacSubjectId) {
      return;
    }

    const connectedProfileIds = Array.from(
      new Set(
        existingRelations
          ?.map((relation) => relation.profileId)
          .filter((profileId): profileId is string => Boolean(profileId)) || [],
      ),
    );
    const connectedProfiles = connectedProfileIds.length
      ? await this.socialModule.profile.find({
          params: {
            filters: {
              and: [
                {
                  column: "id",
                  method: "inArray",
                  value: connectedProfileIds,
                },
              ],
            },
          },
        })
      : [];

    for (const profile of connectedProfiles || []) {
      if (
        profile.variant !== "artificial-intelligence" ||
        profile.id === props.personalAiSocialModuleProfile.id
      ) {
        continue;
      }

      await this.ensureProfileManagementAccess({
        ownerRbacSubjectId: props.ownerRbacSubjectId,
        socialModuleProfileId: profile.id,
      });
    }
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
      if (identities.length > 1) {
        throw new Error(
          "Data integrity error. Multiple Telegram identities found for one account",
        );
      }

      const identity = identities[0];
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
        if (subjectsToIdentities.length > 1) {
          throw new Error(
            "Data integrity error. Identity is linked to multiple subjects",
          );
        }

        subject = await this.findById({
          id: subjectsToIdentities[0].subjectId,
        });

        if (!subject) {
          throw new Error(
            "Internal error. Subject not found for the given identity link",
          );
        }
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
        if (socialModuleProfiles.length > 1) {
          throw new Error(
            "Data integrity error. Multiple Telegram profiles found for one subject",
          );
        }

        profile = socialModuleProfiles[0];
      } else {
        profile = await socialModuleProfileApi.create({
          data: {
            variant: "telegram",
            slug: `telegram-profile-${subject.id}`,
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
          slug: `telegram-profile-${subject.id}`,
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

    chat = await this.resolveTelegramChat({
      chatId: props.chatId,
      profileId: profile.id,
      headers,
    });

    if (!chat) {
      throw new Error(
        "Internal error. Social module chat not initialized for profile",
      );
    }

    const personalAiAgent = await this.resolvePersonalAiAgent({
      ownerRbacSubject: subject,
      socialModuleChatId: chat.id,
    });

    await this.ensureTelegramAutomaticProfilesForChat({
      ownerRbacSubjectId: subject.id,
      socialModuleChatId: chat.id,
      personalAiSocialModuleProfile: personalAiAgent.socialModuleProfile,
      headers,
    });

    const thread = await this.resolveThreadForTelegramMessage({
      socialModuleChat: chat,
      chatId: chat.id,
      messageThreadId: props.messageThreadId,
      messageText: props.messageText,
      headers,
    });

    return {
      rbacModuleSubject: subject,
      personalAiRbacModuleSubject: personalAiAgent.rbacModuleSubject,
      socialModuleProfile: profile,
      personalAiSocialModuleProfile: personalAiAgent.socialModuleProfile,
      socialModuleChat: chat,
      socialModuleThread: thread,
      registration,
      isStartCommand,
      shouldCheckoutFreeSubscription: registration || isStartCommand,
    };
  }
}
