/**
 * BDD Suite: Telegram assistant profile management tools
 * Given: an authorized Telegram sender and subject-scoped RBAC management APIs.
 * When: the sender navigates, edits, links, unlinks, or deletes through /assistant.
 * Then: Agent owns the flow, revalidates scope, and uses only the sender JWT.
 */
const mockRbacApi = {
  socialModuleProfileFindByIdChatFindByIdProfileFind: jest.fn(),
  socialModuleProfileFindByIdChatFindByIdProfileFindByIdUpdate: jest.fn(),
  socialModuleProfileFindByIdChatFindByIdProfileFindByIdAvatarUpdate: jest.fn(),
  socialModuleProfileFindByIdChatFindByIdProfileFindByIdSkillFind: jest.fn(),
  socialModuleProfileFindByIdChatFindByIdProfileFindByIdSkillAvailable:
    jest.fn(),
  socialModuleProfileFindByIdChatFindByIdProfileFindByIdSkillCreate: jest.fn(),
  socialModuleProfileFindByIdChatFindByIdProfileFindByIdSkillUpdate: jest.fn(),
  socialModuleProfileFindByIdChatFindByIdProfileFindByIdSkillLink: jest.fn(),
  socialModuleProfileFindByIdChatFindByIdProfileFindByIdSkillUnlink: jest.fn(),
  socialModuleProfileFindByIdChatFindByIdProfileFindByIdKnowledgeDocumentFind:
    jest.fn(),
  socialModuleProfileFindByIdChatFindByIdProfileFindByIdKnowledgeDocumentCreate:
    jest.fn(),
  socialModuleProfileFindByIdChatFindByIdProfileFindByIdKnowledgeDocumentFindByIdUpdate:
    jest.fn(),
  socialModuleProfileFindByIdChatFindByIdProfileFindByIdKnowledgeDocumentFindByIdReindex:
    jest.fn(),
  socialModuleProfileFindByIdChatFindByIdProfileFindByIdKnowledgeDocumentFindByIdDelete:
    jest.fn(),
};

jest.mock("@sps/rbac/models/subject/sdk/server", () => ({ api: mockRbacApi }));

import { TelegramAssistantConversation } from "./telegram-assistant-conversation";
import { TelegramConversationMemoryStore } from "./telegram-conversation-store";
import { TelegramConversationRuntime } from "./telegram-conversation";

const profile = {
  id: "profile-1",
  adminTitle: "Assistant One",
  slug: "assistant-one",
  variant: "artificial-intelligence",
  title: { ru: "Ассистент" },
  subtitle: { ru: "Помощник" },
  description: { ru: "Описание" },
  allowedMcpServerIds: [],
};
const context = {
  key: {
    chatId: "chat-1",
    threadId: "thread-1",
    senderProfileId: "sender-profile",
  },
  requesterSubject: { id: "sender-subject" },
  requesterProfileId: "sender-profile",
  socialModuleChatId: "chat-1",
  requesterJwtToken: "sender-jwt",
} as any;

function createHarness() {
  let nonce = 0;
  const runtime = new TelegramConversationRuntime(
    new TelegramConversationMemoryStore(),
    { nonce: () => `nonce${++nonce}` },
  );
  const transport = {
    create: jest.fn().mockResolvedValue({
      id: "presentation-1",
      sourceSystemId: "telegram-message-1",
    }),
    update: jest.fn().mockResolvedValue({ id: "presentation-1" }),
    resolveProfileAvatar: jest.fn().mockResolvedValue(undefined),
    resolveAvatarFile: jest.fn().mockResolvedValue(undefined),
  };

  return {
    conversation: new TelegramAssistantConversation(runtime),
    runtime,
    transport,
  };
}

function lastData(transport: ReturnType<typeof createHarness>["transport"]) {
  const createOrder = transport.create.mock.invocationCallOrder.at(-1) || -1;
  const updateOrder = transport.update.mock.invocationCallOrder.at(-1) || -1;

  return createOrder > updateOrder
    ? transport.create.mock.calls.at(-1)?.[0]
    : transport.update.mock.calls.at(-1)?.[1];
}

function callback(
  transport: ReturnType<typeof createHarness>["transport"],
  label: string,
) {
  const rows = lastData(transport)?.interaction?.inline_keyboard || [];
  const button = rows.flat().find((item: any) => item.text.includes(label));

  if (!button?.callback_data) {
    throw new Error(`Button not found: ${label}`);
  }

  return button.callback_data as string;
}

describe("TelegramAssistantConversation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRbacApi.socialModuleProfileFindByIdChatFindByIdProfileFind.mockResolvedValue(
      [profile],
    );
    mockRbacApi.socialModuleProfileFindByIdChatFindByIdProfileFindByIdUpdate.mockResolvedValue(
      profile,
    );
    mockRbacApi.socialModuleProfileFindByIdChatFindByIdProfileFindByIdAvatarUpdate.mockResolvedValue(
      {},
    );
    mockRbacApi.socialModuleProfileFindByIdChatFindByIdProfileFindByIdSkillFind.mockResolvedValue(
      [],
    );
    mockRbacApi.socialModuleProfileFindByIdChatFindByIdProfileFindByIdSkillAvailable.mockResolvedValue(
      [],
    );
    mockRbacApi.socialModuleProfileFindByIdChatFindByIdProfileFindByIdKnowledgeDocumentFind.mockResolvedValue(
      [],
    );
  });

  /**
   * BDD Scenario
   * Given: zero, one, or multiple manageable profiles in the current chat.
   * When: the sender enters /assistant.
   * Then: Agent returns an actionable empty state, direct home, or selector.
   */
  it("When: profile cardinality changes Then: entry chooses the correct page", async () => {
    const empty = createHarness();
    mockRbacApi.socialModuleProfileFindByIdChatFindByIdProfileFind.mockResolvedValueOnce(
      [],
    );
    await empty.conversation.enter(context, empty.transport);
    expect(empty.transport.create).toHaveBeenCalledWith(
      expect.objectContaining({
        description: expect.stringContaining("нет доступного AI-ассистента"),
      }),
    );

    const single = createHarness();
    await single.conversation.enter(context, single.transport);
    expect(lastData(single.transport).description).toContain("Ассистент");
    expect(lastData(single.transport).description).toContain(
      "Профиль ассистента открыт",
    );
    expect(single.transport.create).toHaveBeenCalledTimes(1);
    expect(single.transport.update).not.toHaveBeenCalled();
    expect(lastData(single.transport).description).not.toContain(
      "Готовлю меню",
    );

    const multiple = createHarness();
    mockRbacApi.socialModuleProfileFindByIdChatFindByIdProfileFind.mockResolvedValue(
      [profile, { ...profile, id: "profile-2", adminTitle: "Assistant Two" }],
    );
    await multiple.conversation.enter(context, multiple.transport);
    expect(lastData(multiple.transport).description).toContain(
      "Выберите AI-ассистента",
    );
    expect(callback(multiple.transport, "Assistant Two")).toContain("select");
  });

  /**
   * BDD Scenario
   * Given: the selected profile has a current image relation.
   * When: the assistant home is rendered.
   * Then: Telegram exposes the avatar status and a link to the current image.
   */
  it("When: a profile avatar exists Then: home exposes the current image", async () => {
    const harness = createHarness();
    harness.transport.resolveProfileAvatar.mockResolvedValue({
      url: "https://files.example.com/avatar.png",
      alt: "Assistant avatar",
    });

    await harness.conversation.enter(context, harness.transport);

    expect(lastData(harness.transport).description).toContain(
      "Аватар: установлен",
    );
    expect(
      lastData(harness.transport).interaction.inline_keyboard.flat(),
    ).toContainEqual({
      text: "Открыть текущий аватар",
      url: "https://files.example.com/avatar.png",
    });
  });

  /**
   * BDD Scenario
   * Given: more than one page of manageable profiles with production-length UUIDs.
   * When: the sender pages forward and selects a profile.
   * Then: callback data stays within Telegram's limit and resolves the opaque token to the current UUID.
   */
  it("When: UUID profiles are paged Then: compact callbacks resolve against current data", async () => {
    const harness = createHarness();
    const profiles = Array.from({ length: 7 }, (_, index) => ({
      ...profile,
      id: `00000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
      adminTitle: `Assistant ${index + 1}`,
    }));
    mockRbacApi.socialModuleProfileFindByIdChatFindByIdProfileFind.mockResolvedValue(
      profiles,
    );

    await harness.conversation.enter(context, harness.transport);
    const firstProfileCallback = callback(harness.transport, "Assistant 1");

    expect(firstProfileCallback.length).toBeLessThanOrEqual(64);
    expect(firstProfileCallback).not.toContain(profiles[0].id);

    await harness.conversation.handleCallback(
      context,
      callback(harness.transport, "→"),
      harness.transport,
    );
    await harness.conversation.handleCallback(
      context,
      callback(harness.transport, "Assistant 7"),
      harness.transport,
    );

    expect((await harness.runtime.get(context.key))?.selectedProfileId).toBe(
      profiles[6].id,
    );
    expect(lastData(harness.transport).description).toContain("Ассистент");
  });

  /**
   * BDD Scenario
   * Given: one selected manageable profile.
   * When: the sender completes the four-field Profile editor.
   * Then: the mutation uses the sender identity and JWT, not the bot subject.
   */
  it("When: profile editor completes Then: sender-scoped RBAC update is used", async () => {
    const harness = createHarness();
    await harness.conversation.enter(context, harness.transport);
    await harness.conversation.handleCallback(
      context,
      callback(harness.transport, "Профиль"),
      harness.transport,
    );
    await harness.conversation.handleCallback(
      context,
      callback(harness.transport, "Редактировать"),
      harness.transport,
    );

    for (const description of ["Admin", "Название", "Подзаголовок", "Текст"]) {
      await harness.conversation.handleMessage(
        context,
        { id: `message-${description}`, description } as any,
        harness.transport,
      );
    }

    expect(
      mockRbacApi.socialModuleProfileFindByIdChatFindByIdProfileFindByIdUpdate,
    ).not.toHaveBeenCalled();
    await harness.conversation.handleCallback(
      context,
      callback(harness.transport, "Сохранить"),
      harness.transport,
    );

    expect(
      mockRbacApi.socialModuleProfileFindByIdChatFindByIdProfileFindByIdUpdate,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "sender-subject",
        socialModuleProfileId: "sender-profile",
        socialModuleChatId: "chat-1",
        targetSocialModuleProfileId: "profile-1",
        options: {
          headers: {
            Authorization: "Bearer sender-jwt",
            "Cache-Control": "no-store",
          },
        },
        data: {
          adminTitle: "Admin",
          title: { ru: "Название" },
          subtitle: { ru: "Подзаголовок" },
          description: { ru: "Текст" },
        },
      }),
    );
  });

  /**
   * BDD Scenario
   * Given: a localized profile with optional fields and an active editor.
   * When: the sender skips unchanged values, clears an optional field, and explicitly saves.
   * Then: current values are visible and non-Russian locales are preserved.
   */
  it("When: profile fields are skipped or cleared Then: explicit save preserves other locales", async () => {
    const harness = createHarness();
    const localizedProfile = {
      ...profile,
      title: { en: "Assistant", ru: "Ассистент" },
      subtitle: { en: "Helper", ru: "Помощник" },
      description: { en: "Description", ru: "Описание" },
    };
    mockRbacApi.socialModuleProfileFindByIdChatFindByIdProfileFind.mockResolvedValue(
      [localizedProfile],
    );
    await harness.conversation.enter(context, harness.transport);
    await harness.conversation.handleCallback(
      context,
      callback(harness.transport, "Профиль"),
      harness.transport,
    );
    await harness.conversation.handleCallback(
      context,
      callback(harness.transport, "Редактировать"),
      harness.transport,
    );

    expect(lastData(harness.transport).description).toContain(
      "Текущее значение: Assistant One",
    );
    await harness.conversation.handleCallback(
      context,
      callback(harness.transport, "Пропустить"),
      harness.transport,
    );
    await harness.conversation.handleMessage(
      context,
      { id: "new-title", description: "Новый ассистент" } as any,
      harness.transport,
    );
    await harness.conversation.handleCallback(
      context,
      callback(harness.transport, "Очистить"),
      harness.transport,
    );
    await harness.conversation.handleCallback(
      context,
      callback(harness.transport, "Пропустить"),
      harness.transport,
    );

    expect(
      mockRbacApi.socialModuleProfileFindByIdChatFindByIdProfileFindByIdUpdate,
    ).not.toHaveBeenCalled();
    expect(lastData(harness.transport).description).toContain(
      "Проверьте изменения профиля",
    );
    await harness.conversation.handleCallback(
      context,
      callback(harness.transport, "Сохранить"),
      harness.transport,
    );

    expect(
      mockRbacApi.socialModuleProfileFindByIdChatFindByIdProfileFindByIdUpdate,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          adminTitle: "Assistant One",
          title: { en: "Assistant", ru: "Новый ассистент" },
          subtitle: { en: "Helper", ru: "" },
          description: { en: "Description", ru: "Описание" },
        },
      }),
    );
  });

  /**
   * BDD Scenario
   * Given: a supported MCP descriptor and an unknown stored descriptor.
   * When: the sender toggles the supported descriptor.
   * Then: Agent sends the supported selection and the RBAC route preserves stale IDs.
   */
  it("When: MCP is toggled Then: the supported identifier changes without dropping legacy values", async () => {
    const harness = createHarness();
    mockRbacApi.socialModuleProfileFindByIdChatFindByIdProfileFind.mockResolvedValue(
      [{ ...profile, allowedMcpServerIds: ["retired-server"] }],
    );
    await harness.conversation.enter(context, harness.transport);
    await harness.conversation.handleCallback(
      context,
      callback(harness.transport, "MCP"),
      harness.transport,
    );
    await harness.conversation.handleCallback(
      context,
      callback(harness.transport, "SinglePageStartup"),
      harness.transport,
    );

    expect(
      mockRbacApi.socialModuleProfileFindByIdChatFindByIdProfileFindByIdUpdate,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          allowedMcpServerIds: ["retired-server", "singlepagestartup"],
        },
      }),
    );
  });

  /**
   * BDD Scenario
   * Given: a linked global skill.
   * When: the sender confirms unlink from the selected profile.
   * Then: only the relation-only unlink endpoint is called.
   */
  it("When: skill unlink is confirmed Then: global skill deletion is never requested", async () => {
    const harness = createHarness();
    const skill = {
      id: "skill-1",
      title: "Search",
      slug: "search",
      description: "Find things",
    };
    mockRbacApi.socialModuleProfileFindByIdChatFindByIdProfileFindByIdSkillFind.mockResolvedValue(
      [skill],
    );
    await harness.conversation.enter(context, harness.transport);
    await harness.conversation.handleCallback(
      context,
      callback(harness.transport, "Навыки"),
      harness.transport,
    );
    await harness.conversation.handleCallback(
      context,
      callback(harness.transport, "Search"),
      harness.transport,
    );
    await harness.conversation.handleCallback(
      context,
      callback(harness.transport, "Отвязать"),
      harness.transport,
    );
    await harness.conversation.handleCallback(
      context,
      callback(harness.transport, "Да, отвязать"),
      harness.transport,
    );

    expect(
      mockRbacApi.socialModuleProfileFindByIdChatFindByIdProfileFindByIdSkillUnlink,
    ).toHaveBeenCalledWith(
      expect.objectContaining({ socialModuleSkillId: "skill-1" }),
    );
  });

  /**
   * BDD Scenario
   * Given: one available skill and one linked skill.
   * When: the sender links, creates, and edits through the Skills pages.
   * Then: every operation uses the subject-scoped relation/profile contracts.
   */
  it("When: Skills workflows run Then: link create and edit actions stay subject-scoped", async () => {
    const harness = createHarness();
    const linkedSkill = {
      id: "11111111-1111-4111-8111-111111111111",
      title: "Search",
      slug: "search",
      description: "Find things",
    };
    const availableSkill = {
      id: "22222222-2222-4222-8222-222222222222",
      title: "Summarize",
      slug: "summarize",
      description: "Summarize things",
    };
    mockRbacApi.socialModuleProfileFindByIdChatFindByIdProfileFindByIdSkillFind.mockResolvedValue(
      [linkedSkill],
    );
    mockRbacApi.socialModuleProfileFindByIdChatFindByIdProfileFindByIdSkillAvailable.mockResolvedValue(
      [availableSkill],
    );

    await harness.conversation.enter(context, harness.transport);
    await harness.conversation.handleCallback(
      context,
      callback(harness.transport, "Навыки"),
      harness.transport,
    );
    await harness.conversation.handleCallback(
      context,
      callback(harness.transport, "Доступные"),
      harness.transport,
    );
    await harness.conversation.handleCallback(
      context,
      callback(harness.transport, "Summarize"),
      harness.transport,
    );

    expect(
      mockRbacApi.socialModuleProfileFindByIdChatFindByIdProfileFindByIdSkillLink,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        socialModuleSkillId: availableSkill.id,
        id: "sender-subject",
      }),
    );

    await harness.conversation.handleCallback(
      context,
      callback(harness.transport, "Подключённые"),
      harness.transport,
    );
    await harness.conversation.handleCallback(
      context,
      callback(harness.transport, "Создать"),
      harness.transport,
    );
    for (const value of ["New Skill", "new-skill", "New description"]) {
      await harness.conversation.handleMessage(
        context,
        { id: `create-${value}`, description: value } as any,
        harness.transport,
      );
    }
    expect(
      mockRbacApi.socialModuleProfileFindByIdChatFindByIdProfileFindByIdSkillCreate,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          title: "New Skill",
          slug: "new-skill",
          description: "New description",
        },
      }),
    );

    await harness.conversation.handleCallback(
      context,
      callback(harness.transport, "Search"),
      harness.transport,
    );
    await harness.conversation.handleCallback(
      context,
      callback(harness.transport, "Редактировать"),
      harness.transport,
    );
    for (const value of ["Updated Skill", "updated-skill", "Updated text"]) {
      await harness.conversation.handleMessage(
        context,
        { id: `edit-${value}`, description: value } as any,
        harness.transport,
      );
    }
    expect(
      mockRbacApi.socialModuleProfileFindByIdChatFindByIdProfileFindByIdSkillUpdate,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        socialModuleSkillId: linkedSkill.id,
        data: {
          title: "Updated Skill",
          slug: "updated-skill",
          description: "Updated text",
        },
      }),
    );
  });

  /**
   * BDD Scenario
   * Given: a skill draft receives an invalid slug and then a downstream create failure.
   * When: editor messages are consumed.
   * Then: no invalid mutation runs and the recoverable draft remains on the failing field.
   */
  it("When: skill input or service fails Then: the editor remains recoverable", async () => {
    const harness = createHarness();
    mockRbacApi.socialModuleProfileFindByIdChatFindByIdProfileFindByIdSkillCreate.mockRejectedValueOnce(
      new Error("service unavailable"),
    );
    await harness.conversation.enter(context, harness.transport);
    await harness.conversation.handleCallback(
      context,
      callback(harness.transport, "Навыки"),
      harness.transport,
    );
    await harness.conversation.handleCallback(
      context,
      callback(harness.transport, "Создать"),
      harness.transport,
    );
    await harness.conversation.handleMessage(
      context,
      { id: "title", description: "Draft" } as any,
      harness.transport,
    );
    await harness.conversation.handleMessage(
      context,
      { id: "bad-slug", description: "not a slug!" } as any,
      harness.transport,
    );

    expect(
      mockRbacApi.socialModuleProfileFindByIdChatFindByIdProfileFindByIdSkillCreate,
    ).not.toHaveBeenCalled();
    expect((await harness.runtime.get(context.key))?.editor?.field).toBe(
      "slug",
    );

    await harness.conversation.handleMessage(
      context,
      { id: "good-slug", description: "draft-skill" } as any,
      harness.transport,
    );
    await harness.conversation.handleMessage(
      context,
      { id: "description", description: "Draft text" } as any,
      harness.transport,
    );

    expect((await harness.runtime.get(context.key))?.editor?.field).toBe(
      "description",
    );
    expect(lastData(harness.transport).description).toContain(
      "service unavailable",
    );
  });

  /**
   * BDD Scenario
   * Given: a currently linked Knowledge document.
   * When: delete is requested but not yet confirmed, then confirmed freshly.
   * Then: no delete occurs before confirmation and one delete occurs afterward.
   */
  it("When: Knowledge delete is confirmed Then: destructive action runs once", async () => {
    const harness = createHarness();
    const document = {
      id: "document-1",
      title: "Facts",
      description: "Content",
    };
    mockRbacApi.socialModuleProfileFindByIdChatFindByIdProfileFindByIdKnowledgeDocumentFind.mockResolvedValue(
      [document],
    );
    await harness.conversation.enter(context, harness.transport);
    await harness.conversation.handleCallback(
      context,
      callback(harness.transport, "Знания"),
      harness.transport,
    );
    await harness.conversation.handleCallback(
      context,
      callback(harness.transport, "Facts"),
      harness.transport,
    );
    await harness.conversation.handleCallback(
      context,
      callback(harness.transport, "Удалить"),
      harness.transport,
    );
    expect(
      mockRbacApi.socialModuleProfileFindByIdChatFindByIdProfileFindByIdKnowledgeDocumentFindByIdDelete,
    ).not.toHaveBeenCalled();

    const confirmData = callback(harness.transport, "Да, удалить");
    await harness.conversation.handleCallback(
      context,
      confirmData,
      harness.transport,
    );
    await harness.conversation.handleCallback(
      context,
      confirmData,
      harness.transport,
    );

    expect(
      mockRbacApi.socialModuleProfileFindByIdChatFindByIdProfileFindByIdKnowledgeDocumentFindByIdDelete,
    ).toHaveBeenCalledTimes(1);
  });

  /**
   * BDD Scenario
   * Given: a Knowledge document whose content exceeds Telegram's message limit.
   * When: the sender opens that document from the assistant menu.
   * Then: Agent sends the complete content as a TXT file and keeps the menu text bounded.
   */
  it("When: a long Knowledge document opens Then: its content is sent as a TXT file", async () => {
    const harness = createHarness();
    const document = {
      id: "document-long",
      title: 'Release / notes: "Summer"',
      description: "Полное содержимое\n" + "x".repeat(6_000),
    };
    mockRbacApi.socialModuleProfileFindByIdChatFindByIdProfileFindByIdKnowledgeDocumentFind.mockResolvedValue(
      [document],
    );

    await harness.conversation.enter(context, harness.transport);
    await harness.conversation.handleCallback(
      context,
      callback(harness.transport, "Знания"),
      harness.transport,
    );
    await harness.conversation.handleCallback(
      context,
      callback(harness.transport, "Release"),
      harness.transport,
    );

    const fileMessage = harness.transport.create.mock.calls.find(
      ([data]) => data.files?.length,
    )?.[0];
    const file = fileMessage?.files?.[0];

    expect(fileMessage?.description).toContain("Knowledge-документ");
    expect(file).toBeInstanceOf(File);
    expect(file?.name).toBe("Release - notes- -Summer-.txt");
    expect(file?.type).toBe("text/plain");
    await expect(file?.text()).resolves.toBe(
      `${document.title}\n\n${document.description}`,
    );
    expect(lastData(harness.transport).description.length).toBeLessThan(4_096);
    expect(lastData(harness.transport).description).not.toContain(
      document.description,
    );
    expect(lastData(harness.transport).description).toContain(
      "Содержимое отправлено отдельным TXT-файлом.",
    );
  });

  /**
   * BDD Scenario
   * Given: one linked Knowledge document.
   * When: the sender creates, edits, and explicitly reindexes documents.
   * Then: each distinct subject-scoped Knowledge action is invoked with current data.
   */
  it("When: Knowledge workflows run Then: create edit and reindex remain explicit", async () => {
    const harness = createHarness();
    const document = {
      id: "33333333-3333-4333-8333-333333333333",
      title: "Facts",
      description: "Old content",
    };
    mockRbacApi.socialModuleProfileFindByIdChatFindByIdProfileFindByIdKnowledgeDocumentFind.mockResolvedValue(
      [document],
    );
    await harness.conversation.enter(context, harness.transport);
    await harness.conversation.handleCallback(
      context,
      callback(harness.transport, "Знания"),
      harness.transport,
    );
    await harness.conversation.handleCallback(
      context,
      callback(harness.transport, "Создать документ"),
      harness.transport,
    );
    for (const value of ["New facts", "New content"]) {
      await harness.conversation.handleMessage(
        context,
        { id: `create-${value}`, description: value } as any,
        harness.transport,
      );
    }
    expect(
      mockRbacApi.socialModuleProfileFindByIdChatFindByIdProfileFindByIdKnowledgeDocumentCreate,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { title: "New facts", description: "New content" },
      }),
    );

    await harness.conversation.handleCallback(
      context,
      callback(harness.transport, "Facts"),
      harness.transport,
    );
    await harness.conversation.handleCallback(
      context,
      callback(harness.transport, "Редактировать"),
      harness.transport,
    );
    for (const value of ["Updated facts", "Updated content"]) {
      await harness.conversation.handleMessage(
        context,
        { id: `edit-${value}`, description: value } as any,
        harness.transport,
      );
    }
    expect(
      mockRbacApi.socialModuleProfileFindByIdChatFindByIdProfileFindByIdKnowledgeDocumentFindByIdUpdate,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        knowledgeModuleDocumentId: document.id,
        data: { title: "Updated facts", description: "Updated content" },
      }),
    );

    await harness.conversation.handleCallback(
      context,
      callback(harness.transport, "Facts"),
      harness.transport,
    );
    await harness.conversation.handleCallback(
      context,
      callback(harness.transport, "Переиндексировать"),
      harness.transport,
    );
    expect(
      mockRbacApi.socialModuleProfileFindByIdChatFindByIdProfileFindByIdKnowledgeDocumentFindByIdReindex,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        knowledgeModuleDocumentId: document.id,
      }),
    );
  });

  /**
   * BDD Scenario
   * Given: the Avatar editor and a persisted incoming image.
   * When: the sender uploads that image.
   * Then: the existing subject-scoped avatar action receives it.
   */
  it("When: avatar image arrives Then: canonical avatar action is reused", async () => {
    const harness = createHarness();
    const image = new File(["image"], "avatar.jpg", { type: "image/jpeg" });
    harness.transport.resolveAvatarFile.mockResolvedValue(image);
    await harness.conversation.enter(context, harness.transport);
    await harness.conversation.handleCallback(
      context,
      callback(harness.transport, "Аватар"),
      harness.transport,
    );
    await harness.conversation.handleMessage(
      context,
      { id: "photo-message", description: "" } as any,
      harness.transport,
    );

    expect(
      mockRbacApi.socialModuleProfileFindByIdChatFindByIdProfileFindByIdAvatarUpdate,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "sender-subject",
        data: { file: image },
      }),
    );
  });

  /**
   * BDD Scenario
   * Given: an active menu whose target management permission is revoked.
   * When: the next page render reloads manageable profiles.
   * Then: the runtime terminates and removes all live controls without a mutation.
   */
  it("When: permission is lost Then: the current conversation closes safely", async () => {
    const harness = createHarness();
    await harness.conversation.enter(context, harness.transport);
    mockRbacApi.socialModuleProfileFindByIdChatFindByIdProfileFind.mockResolvedValue(
      [],
    );

    await harness.conversation.handleCallback(
      context,
      callback(harness.transport, "Обновить"),
      harness.transport,
    );

    expect(await harness.runtime.get(context.key)).toBeUndefined();
    expect(lastData(harness.transport).description).toContain("Диалог закрыт");
    expect(lastData(harness.transport).interaction.inline_keyboard).toEqual([]);
  });

  /**
   * BDD Scenario
   * Given: Telegram can no longer edit the original presentation message.
   * When: the sender navigates with its current button.
   * Then: Agent creates one complete replacement presentation without a loading placeholder and invalidates old controls.
   */
  it("When: presentation edit fails Then: one replacement carries the current menu", async () => {
    const harness = createHarness();
    await harness.conversation.enter(context, harness.transport);
    const oldProfileButton = callback(harness.transport, "Профиль");
    harness.transport.update.mockRejectedValueOnce(
      new Error("message cannot be edited"),
    );
    harness.transport.create.mockResolvedValueOnce({
      id: "presentation-2",
      sourceSystemId: "telegram-message-2",
    });

    await harness.conversation.handleCallback(
      context,
      oldProfileButton,
      harness.transport,
    );

    expect(harness.transport.create).toHaveBeenCalledTimes(2);
    expect(harness.transport.create).toHaveBeenLastCalledWith(
      expect.objectContaining({
        description: expect.stringContaining("Профиль"),
        interaction: expect.objectContaining({
          inline_keyboard: expect.any(Array),
        }),
      }),
    );
    expect(lastData(harness.transport).description).not.toContain(
      "Восстанавливаю актуальное меню",
    );
    expect(
      (await harness.runtime.get(context.key))?.presentationMessageId,
    ).toBe("presentation-2");
    expect(lastData(harness.transport).description).toContain("Профиль");

    await harness.conversation.handleCallback(
      context,
      oldProfileButton,
      harness.transport,
    );
    expect(harness.transport.create).toHaveBeenLastCalledWith(
      expect.objectContaining({
        description: expect.stringContaining("устарело"),
      }),
    );
  });
});
