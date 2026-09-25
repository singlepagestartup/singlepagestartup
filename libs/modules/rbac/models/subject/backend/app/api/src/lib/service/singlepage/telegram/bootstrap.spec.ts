/**
 * BDD Suite: Telegram bootstrap thread and participant initialization.
 *
 * Given: a Telegram chat or topic requires SPS records.
 * When: bootstrap initializes the missing records.
 * Then: deterministic natural keys are used and required participants are connected.
 */

const mockSocialModuleChatsToThreadsCreate = jest.fn();
const mockSocialModuleChatCreate = jest.fn();
const mockSocialModuleThreadCreate = jest.fn();
const mockSocialModuleThreadUpdate = jest.fn();
const mockOpenRouterGenerate = jest.fn();
const mockSocialModuleProfilesToChatsCreate = jest.fn();
const mockRbacSubjectCreate = jest.fn();
const mockRbacSubjectDelete = jest.fn();
const mockSubjectsToIdentitiesCreate = jest.fn();
const originalFetch = global.fetch;

jest.mock("@sps/shared-utils", () => ({
  RBAC_SECRET_KEY: "test-rbac-secret",
  TELEGRAM_SERVICE_BOT_TOKEN: "test-telegram-token",
}));

jest.mock("@sps/social/relations/chats-to-threads/sdk/server", () => ({
  api: {
    create: (...args: unknown[]) =>
      mockSocialModuleChatsToThreadsCreate(...args),
  },
}));

jest.mock("@sps/social/models/thread/sdk/server", () => ({
  api: {
    create: (...args: unknown[]) => mockSocialModuleThreadCreate(...args),
    update: (...args: unknown[]) => mockSocialModuleThreadUpdate(...args),
  },
}));

jest.mock("@sps/social/models/chat/sdk/server", () => ({
  api: {
    create: (...args: unknown[]) => mockSocialModuleChatCreate(...args),
  },
}));

jest.mock("@sps/social/relations/profiles-to-chats/sdk/server", () => ({
  api: {
    create: (...args: unknown[]) =>
      mockSocialModuleProfilesToChatsCreate(...args),
  },
}));

jest.mock("@sps/shared-third-parties", () => ({
  OpenRouter: jest.fn().mockImplementation(() => ({
    generate: (...args: unknown[]) => mockOpenRouterGenerate(...args),
  })),
}));

jest.mock("@sps/rbac/models/subject/sdk/server", () => ({
  api: {
    create: (...args: unknown[]) => mockRbacSubjectCreate(...args),
    delete: (...args: unknown[]) => mockRbacSubjectDelete(...args),
  },
}));

jest.mock("@sps/rbac/relations/subjects-to-identities/sdk/server", () => ({
  api: {
    create: (...args: unknown[]) => mockSubjectsToIdentitiesCreate(...args),
  },
}));

import { Service } from "./bootstrap";
describe("Given: Telegram bootstrap initializes a topic thread", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSocialModuleThreadCreate.mockResolvedValue({
      id: "thread-1",
      variant: "telegram",
      title: "Telegram topic 42",
      sourceSystemId: "42",
    });
    mockSocialModuleThreadUpdate.mockImplementation(async (props) => {
      return {
        id: props.id,
        ...props.data,
      };
    });
    mockOpenRouterGenerate.mockResolvedValue({
      text: JSON.stringify({ title: "🦘 Где кенгуру" }),
      billing: null,
    });
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      statusText: "OK",
      json: jest.fn().mockResolvedValue({
        ok: true,
        result: true,
      }),
    }) as any;
    jest.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  describe("When: first message arrives in a Telegram-created topic", () => {
    /**
     * BDD Scenario
     * Given: Telegram created a new topic and SPS has no mapped thread yet.
     * When: the first user message arrives with message_thread_id.
     * Then: SPS creates the fallback thread, generates a contextual title, and mirrors it to Telegram.
     */
    it("Then: creates thread and applies generated title", async () => {
      const service = new Service({
        findById: jest.fn(),
        identity: {} as any,
        subjectsToIdentities: {} as any,
        subjectsToSocialModuleProfiles: {} as any,
        socialModule: {
          chatsToThreads: {
            find: jest.fn().mockResolvedValue([]),
          },
        } as any,
      });

      const result = await (service as any).resolveThreadForTelegramMessage({
        socialModuleChat: {
          id: "chat-1",
          variant: "telegram",
          sourceSystemId: "550809313",
        },
        chatId: "chat-1",
        messageThreadId: "42",
        messageText: "Где живут кенгуру?",
        headers: {
          "X-RBAC-SECRET-KEY": "test-rbac-secret",
        },
      });

      expect(mockSocialModuleThreadCreate).toHaveBeenCalledWith({
        data: {
          variant: "telegram",
          title: "Telegram topic 42",
          sourceSystemId: "42",
          slug: "telegram-thread-chat-1-42",
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": "test-rbac-secret",
          },
        },
      });
      expect(mockOpenRouterGenerate).toHaveBeenCalledWith({
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
          expect.objectContaining({
            role: "system",
          }),
          {
            role: "user",
            content: "Где живут кенгуру?",
          },
        ],
      });
      expect(mockSocialModuleThreadUpdate).toHaveBeenCalledWith({
        id: "thread-1",
        data: {
          title: "Где кенгуру 🦘",
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": "test-rbac-secret",
          },
        },
      });
      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.telegram.org/bottest-telegram-token/editForumTopic",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            chat_id: "550809313",
            message_thread_id: 42,
            name: "Где кенгуру 🦘",
          }),
        }),
      );
      expect(result).toMatchObject({
        id: "thread-1",
        title: "Где кенгуру 🦘",
      });
    });

    /**
     * BDD Scenario
     * Given: the first Telegram topic message uses the Knowledge search command with a request.
     * When: bootstrap generates a contextual topic title.
     * Then: it sends only the request text to the title model and applies the generated title.
     */
    it("Then: generates a title from the /knowledge request payload", async () => {
      mockOpenRouterGenerate.mockResolvedValueOnce({
        text: JSON.stringify({ title: "Келлеры в ЖК 🏢" }),
        billing: null,
      });
      const service = new Service({
        findById: jest.fn(),
        identity: {} as any,
        subjectsToIdentities: {} as any,
        subjectsToSocialModuleProfiles: {} as any,
        socialModule: {
          chatsToThreads: {
            find: jest.fn().mockResolvedValue([]),
          },
        } as any,
      });

      const result = await (service as any).resolveThreadForTelegramMessage({
        socialModuleChat: {
          id: "chat-1",
          variant: "telegram",
          sourceSystemId: "550809313",
        },
        chatId: "chat-1",
        messageThreadId: "42",
        messageText: "/knowledge Келлеры в жилом комплексе",
        headers: {
          "X-RBAC-SECRET-KEY": "test-rbac-secret",
        },
      });

      expect(mockOpenRouterGenerate).toHaveBeenCalledWith(
        expect.objectContaining({
          context: [
            expect.objectContaining({
              role: "system",
            }),
            {
              role: "user",
              content: "Келлеры в жилом комплексе",
            },
          ],
        }),
      );
      expect(mockSocialModuleThreadUpdate).toHaveBeenCalledWith({
        id: "thread-1",
        data: {
          title: "Келлеры в ЖК 🏢",
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": "test-rbac-secret",
          },
        },
      });
      expect(result).toMatchObject({
        id: "thread-1",
        title: "Келлеры в ЖК 🏢",
      });
    });

    /**
     * BDD Scenario
     * Given: Telegram addresses the legacy learn command to a specific bot username.
     * When: bootstrap derives text for topic title generation.
     * Then: it removes the command and keeps the learn payload.
     */
    it("Then: derives a title source from an addressed /learn command", () => {
      const service = new Service({
        findById: jest.fn(),
        identity: {} as any,
        subjectsToIdentities: {} as any,
        subjectsToSocialModuleProfiles: {} as any,
        socialModule: {} as any,
      });

      expect(
        (service as any).getTelegramThreadTitleSourceFromMessage(
          "/learn@singlepagestartup_bot Новый материал о келлерах",
        ),
      ).toBe("Новый материал о келлерах");
      expect(
        (service as any).getTelegramThreadTitleSourceFromMessage("/start"),
      ).toBeUndefined();
    });

    /**
     * BDD Scenario
     * Given: OpenRouter returns a loose title field instead of the requested JSON object.
     * When: SPS generates a title for a Telegram topic.
     * Then: the technical title field label is removed from the visible topic title.
     */
    it("Then: removes a loose title field label from generated title", async () => {
      mockOpenRouterGenerate.mockResolvedValueOnce({
        text: "title : Келлеры 💬",
        billing: null,
      });
      const service = new Service({
        findById: jest.fn(),
        identity: {} as any,
        subjectsToIdentities: {} as any,
        subjectsToSocialModuleProfiles: {} as any,
        socialModule: {} as any,
      });

      const title = await (service as any).generateTelegramThreadTitle({
        messageText: "Келлеры",
      });

      expect(title).toBe("Келлеры 💬");
    });

    /**
     * BDD Scenario
     * Given: OpenRouter puts a redundant title label inside the structured title value.
     * When: SPS generates a title for a Telegram topic.
     * Then: the persisted title contains only the meaningful title and emoji.
     */
    it("Then: removes a field label from a structured title value", async () => {
      mockOpenRouterGenerate.mockResolvedValueOnce({
        text: JSON.stringify({
          title: "title : Возможности ассистента 🤖",
        }),
        billing: null,
      });
      const service = new Service({
        findById: jest.fn(),
        identity: {} as any,
        subjectsToIdentities: {} as any,
        subjectsToSocialModuleProfiles: {} as any,
        socialModule: {} as any,
      });

      const title = await (service as any).generateTelegramThreadTitle({
        messageText: "Расскажи что ты умеешь?",
      });

      expect(title).toBe("Возможности ассистента 🤖");
    });

    /**
     * BDD Scenario
     * Given: a Telegram topic already persisted a loose title field label.
     * When: the next message in that topic is bootstrapped.
     * Then: SPS repairs both its stored thread title and the Telegram topic title.
     */
    it("Then: repairs an already persisted loose title field label", async () => {
      const service = new Service({
        findById: jest.fn(),
        identity: {} as any,
        subjectsToIdentities: {} as any,
        subjectsToSocialModuleProfiles: {} as any,
        socialModule: {
          chatsToThreads: {
            find: jest.fn().mockResolvedValue([
              {
                id: "chat-thread-1",
                chatId: "chat-1",
                threadId: "thread-1",
              },
            ]),
          },
          thread: {
            find: jest.fn().mockResolvedValue([
              {
                id: "thread-1",
                variant: "telegram",
                title: "title : Келлеры 💬",
                sourceSystemId: "42",
              },
            ]),
          },
        } as any,
      });

      const result = await (service as any).resolveThreadForTelegramMessage({
        socialModuleChat: {
          id: "chat-1",
          variant: "telegram",
          sourceSystemId: "550809313",
        },
        chatId: "chat-1",
        messageThreadId: "42",
        messageText: "Следующее сообщение",
        headers: {
          "X-RBAC-SECRET-KEY": "test-rbac-secret",
        },
      });

      expect(mockOpenRouterGenerate).not.toHaveBeenCalled();
      expect(mockSocialModuleThreadUpdate).toHaveBeenCalledWith({
        id: "thread-1",
        data: {
          title: "Келлеры 💬",
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": "test-rbac-secret",
          },
        },
      });
      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.telegram.org/bottest-telegram-token/editForumTopic",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            chat_id: "550809313",
            message_thread_id: 42,
            name: "Келлеры 💬",
          }),
        }),
      );
      expect(result).toMatchObject({
        id: "thread-1",
        title: "Келлеры 💬",
      });
    });

    /**
     * BDD Scenario
     * Given: a Telegram topic thread already has a non-fallback SPS title.
     * When: another message arrives in the same topic.
     * Then: bootstrap keeps the existing title and does not call OpenRouter.
     */
    it("Then: does not regenerate non-fallback title", async () => {
      const service = new Service({
        findById: jest.fn(),
        identity: {} as any,
        subjectsToIdentities: {} as any,
        subjectsToSocialModuleProfiles: {} as any,
        socialModule: {
          chatsToThreads: {
            find: jest.fn().mockResolvedValue([
              {
                id: "chat-thread-1",
                chatId: "chat-1",
                threadId: "thread-1",
              },
            ]),
          },
          thread: {
            find: jest.fn().mockResolvedValue([
              {
                id: "thread-1",
                variant: "telegram",
                title: "Кенгуру 🦘",
                sourceSystemId: "42",
              },
            ]),
          },
        } as any,
      });

      const result = await (service as any).resolveThreadForTelegramMessage({
        socialModuleChat: {
          id: "chat-1",
          variant: "telegram",
          sourceSystemId: "550809313",
        },
        chatId: "chat-1",
        messageThreadId: "42",
        messageText: "Еще вопрос",
        headers: {
          "X-RBAC-SECRET-KEY": "test-rbac-secret",
        },
      });

      expect(result).toMatchObject({
        id: "thread-1",
        title: "Кенгуру 🦘",
      });
      expect(mockOpenRouterGenerate).not.toHaveBeenCalled();
      expect(mockSocialModuleThreadUpdate).not.toHaveBeenCalled();
      expect(global.fetch).not.toHaveBeenCalled();
    });

    /**
     * BDD Scenario
     * Given: OpenRouter fails while naming a fallback Telegram topic.
     * When: the first user message arrives.
     * Then: SPS applies a deterministic fallback title from the message.
     */
    it("Then: uses deterministic fallback title when OpenRouter fails", async () => {
      mockOpenRouterGenerate.mockResolvedValueOnce({
        error: {
          message: "OpenRouter unavailable",
        },
        billing: null,
      });

      const service = new Service({
        findById: jest.fn(),
        identity: {} as any,
        subjectsToIdentities: {} as any,
        subjectsToSocialModuleProfiles: {} as any,
        socialModule: {
          chatsToThreads: {
            find: jest.fn().mockResolvedValue([]),
          },
        } as any,
      });

      const result = await (service as any).resolveThreadForTelegramMessage({
        socialModuleChat: {
          id: "chat-1",
          variant: "telegram",
          sourceSystemId: "550809313",
        },
        chatId: "chat-1",
        messageThreadId: "42",
        messageText: "История интернета сейчас интересует",
        headers: {
          "X-RBAC-SECRET-KEY": "test-rbac-secret",
        },
      });

      expect(mockSocialModuleThreadUpdate).toHaveBeenCalledWith({
        id: "thread-1",
        data: {
          title: "История интернета сейчас 💬",
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": "test-rbac-secret",
          },
        },
      });
      expect(result).toMatchObject({
        id: "thread-1",
        title: "История интернета сейчас 💬",
      });
    });
  });
});

describe("Given: Telegram automatic chat participants", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  /**
   * BDD Scenario: Required profiles are connected without runtime cleanup.
   *
   * Given: a chat contains a manually connected AI profile but lacks required automatic profiles.
   * When: automatic participants are ensured.
   * Then: the personal and system profiles are connected and existing profiles remain untouched.
   */
  it("Then: connects required profiles without deleting existing relations", async () => {
    const ensureProfileManagementAccess = jest.fn().mockResolvedValue({});
    const profilesToChats = {
      find: jest.fn().mockResolvedValue([
        {
          id: "global-ai-relation",
          profileId: "global-ai-profile",
          chatId: "chat-1",
        },
      ]),
    };
    const profile = {
      find: jest.fn().mockImplementation((props: any) => {
        const filters = props?.params?.filters?.and || [];
        const slugFilter = filters.find(
          (filter: any) => filter.column === "slug",
        );

        if (slugFilter?.value === "telegram-bot") {
          return Promise.resolve([
            {
              id: "telegram-bot-profile",
              slug: "telegram-bot",
              variant: "agent",
            },
          ]);
        }

        return Promise.resolve([
          {
            id: "global-ai-profile",
            slug: "open-router",
            variant: "artificial-intelligence",
          },
        ]);
      }),
    };
    const service = new Service({
      findById: jest.fn(),
      identity: {} as any,
      subjectsToIdentities: {} as any,
      subjectsToSocialModuleProfiles: {} as any,
      socialModule: {
        profilesToChats,
        profile,
      } as any,
      ensureProfileManagementAccess,
    });

    await (service as any).ensureTelegramAutomaticProfilesForChat({
      ownerRbacSubjectId: "owner-1",
      socialModuleChatId: "chat-1",
      personalAiSocialModuleProfile: {
        id: "personal-ai-profile",
        slug: "telegram-personal-ai-agent-owner-1",
        variant: "artificial-intelligence",
      },
      headers: {
        "X-RBAC-SECRET-KEY": "test-rbac-secret",
      },
    });

    expect(mockSocialModuleProfilesToChatsCreate).toHaveBeenCalledTimes(2);
    expect(mockSocialModuleProfilesToChatsCreate).toHaveBeenCalledWith({
      data: {
        profileId: "personal-ai-profile",
        chatId: "chat-1",
        variant: "telegram-personal-ai-agent",
      },
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": "test-rbac-secret",
        },
      },
    });
    expect(mockSocialModuleProfilesToChatsCreate).toHaveBeenCalledWith({
      data: {
        profileId: "telegram-bot-profile",
        chatId: "chat-1",
        variant: "telegram-system-agent",
      },
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": "test-rbac-secret",
        },
      },
    });
    expect(ensureProfileManagementAccess).toHaveBeenCalledWith({
      ownerRbacSubjectId: "owner-1",
      socialModuleProfileId: "global-ai-profile",
    });
  });
});

/**
 * BDD Suite: Telegram bootstrap concurrency recovery.
 *
 * Given: two Telegram updates bootstrap the same account at the same time.
 * When: one request loses a natural key insert to the other.
 * Then: the losing request replays bootstrap instead of failing the update.
 */
describe("Given: two Telegram updates race to bootstrap the same account", () => {
  function buildService() {
    return new Service({
      findById: jest.fn(),
      identity: {} as any,
      subjectsToIdentities: {} as any,
      subjectsToSocialModuleProfiles: {} as any,
      socialModule: {} as any,
    });
  }

  function buildConflictError() {
    // The API answers a unique violation with a sanitized 409, so the losing
    // request learns that it lost without learning which constraint it hit.
    const payload = {
      message: "Conflict error. Entity already exists",
      status: 409,
      cause: [{ message: "Conflict error. Entity already exists" }],
    };

    return Object.assign(new Error(JSON.stringify(payload)), {
      status: 409,
      cause: payload,
    });
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns the winning records after losing the identity insert", async () => {
    const service = buildService();
    const bootstrapResult = { rbacModuleSubject: { id: "subject-1" } } as any;
    const executeOnce = jest
      .spyOn(service as any, "executeOnce")
      .mockRejectedValueOnce(buildConflictError())
      .mockResolvedValueOnce(bootstrapResult);
    jest.spyOn(service as any, "getConflictRetryDelays").mockReturnValue([0]);

    await expect(
      service.execute({ fromId: "153077581", chatId: "153077581" }),
    ).resolves.toBe(bootstrapResult);
    expect(executeOnce).toHaveBeenCalledTimes(2);
  });

  it("returns the winning records after losing the topic thread insert", async () => {
    const service = buildService();
    const bootstrapResult = { rbacModuleSubject: { id: "subject-1" } } as any;
    const executeOnce = jest
      .spyOn(service as any, "executeOnce")
      .mockRejectedValueOnce(buildConflictError())
      .mockResolvedValueOnce(bootstrapResult);
    jest.spyOn(service as any, "getConflictRetryDelays").mockReturnValue([0]);

    await expect(
      service.execute({
        fromId: "153077581",
        chatId: "153077581",
        messageThreadId: "114527",
      }),
    ).resolves.toBe(bootstrapResult);
    expect(executeOnce).toHaveBeenCalledTimes(2);
  });

  it("rethrows a failure that is not a natural key conflict", async () => {
    const service = buildService();
    const failure = new Error("Validation error. 'fromId' is required");
    const executeOnce = jest
      .spyOn(service as any, "executeOnce")
      .mockRejectedValue(failure);
    jest.spyOn(service as any, "getConflictRetryDelays").mockReturnValue([0]);

    await expect(
      service.execute({ fromId: "153077581", chatId: "153077581" }),
    ).rejects.toBe(failure);
    expect(executeOnce).toHaveBeenCalledTimes(1);
  });

  /**
   * BDD Scenario: the default replay budget covers a live race.
   *
   * Given: one request lost identity, subject-identity link, profile and
   *        profile-to-chat in sequence during a live concurrent
   *        forum_topic_created and /start pair.
   * When: the default conflict retry budget is read.
   * Then: it leaves headroom over those four consecutive conflicts.
   */
  it("keeps more default replays than the consecutive conflicts a live race produced", () => {
    const service = buildService();

    expect((service as any).getConflictRetryDelays().length).toBeGreaterThan(4);
  });

  it("backs off further on every replay so a lock-stepped pair is pulled apart", () => {
    const service = buildService();
    const delays: number[] = (service as any).getConflictRetryDelays();

    expect(delays).toEqual([...delays].sort((left, right) => left - right));
    expect(new Set(delays).size).toBe(delays.length);
    expect(Math.min(...delays)).toBeGreaterThan(0);
  });

  it("stops replaying once the configured conflict retries are exhausted", async () => {
    const service = buildService();
    const failure = buildConflictError();
    const executeOnce = jest
      .spyOn(service as any, "executeOnce")
      .mockRejectedValue(failure);
    jest
      .spyOn(service as any, "getConflictRetryDelays")
      .mockReturnValue([0, 0]);

    await expect(
      service.execute({ fromId: "153077581", chatId: "153077581" }),
    ).rejects.toBe(failure);
    expect(executeOnce).toHaveBeenCalledTimes(3);
  });
});

/**
 * BDD Suite: Telegram bootstrap subject ownership of an identity.
 *
 * Given: an identity may only be owned by a single rbac.subject.
 * When: two requests try to claim the same identity at once.
 * Then: the losing request leaves no orphaned subject behind.
 */
describe("Given: a telegram identity is claimed by two requests at once", () => {
  const headers = { "X-RBAC-SECRET-KEY": "test-rbac-secret" };

  function buildService() {
    return new Service({
      findById: jest.fn(),
      identity: {} as any,
      subjectsToIdentities: {} as any,
      subjectsToSocialModuleProfiles: {} as any,
      socialModule: {} as any,
    });
  }

  function buildLinkConflict() {
    const payload = {
      message: "Conflict error. Entity already exists",
      status: 409,
    };

    return Object.assign(new Error(JSON.stringify(payload)), {
      status: 409,
      cause: payload,
    });
  }

  beforeEach(() => {
    jest.clearAllMocks();
    mockRbacSubjectCreate.mockResolvedValue({ id: "subject-1" });
    mockRbacSubjectDelete.mockResolvedValue(undefined);
  });

  it("links the new subject to the identity when it wins", async () => {
    mockSubjectsToIdentitiesCreate.mockResolvedValue({ id: "link-1" });
    const service = buildService();

    const subject = await (service as any).createSubjectForIdentity({
      identityId: "identity-1",
      headers,
    });

    expect(subject).toEqual({ id: "subject-1" });
    expect(mockSubjectsToIdentitiesCreate).toHaveBeenCalledWith({
      data: { subjectId: "subject-1", identityId: "identity-1" },
      options: { headers },
    });
    expect(mockRbacSubjectDelete).not.toHaveBeenCalled();
  });

  it("drops the subject it created and rethrows when it loses the link", async () => {
    const conflict = buildLinkConflict();
    mockSubjectsToIdentitiesCreate.mockRejectedValue(conflict);
    const service = buildService();

    await expect(
      (service as any).createSubjectForIdentity({
        identityId: "identity-1",
        headers,
      }),
    ).rejects.toBe(conflict);
    expect(mockRbacSubjectDelete).toHaveBeenCalledWith({
      id: "subject-1",
      options: { headers },
    });
  });

  it("keeps the subject when the link fails for an unrelated reason", async () => {
    const failure = new Error("Permission error. Not allowed");
    mockSubjectsToIdentitiesCreate.mockRejectedValue(failure);
    const service = buildService();

    await expect(
      (service as any).createSubjectForIdentity({
        identityId: "identity-1",
        headers,
      }),
    ).rejects.toBe(failure);
    expect(mockRbacSubjectDelete).not.toHaveBeenCalled();
  });

  it("still rethrows the conflict when the orphan subject cannot be dropped", async () => {
    const conflict = buildLinkConflict();
    mockSubjectsToIdentitiesCreate.mockRejectedValue(conflict);
    mockRbacSubjectDelete.mockRejectedValue(new Error("delete failed"));
    const service = buildService();

    await expect(
      (service as any).createSubjectForIdentity({
        identityId: "identity-1",
        headers,
      }),
    ).rejects.toBe(conflict);
  });
});
