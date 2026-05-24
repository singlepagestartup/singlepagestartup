/**
 * BDD Suite: rbac social skill transcript run.
 *
 * Given: a social profile has profile-scoped skills.
 * When: the subject runs a selected skill from a chat thread.
 * Then: the transcript is ingested into Knowledge and the generated output is saved only as chat messages.
 */

const mockKnowledgeIngestTranscript = jest.fn();
const mockLlmComplete = jest.fn();
const mockSocialModuleMessageCreate = jest.fn();
const mockSocialModuleProfilesToMessagesCreate = jest.fn();
const mockSocialModuleChatsToMessagesCreate = jest.fn();
const mockSocialModuleThreadsToMessagesCreate = jest.fn();

jest.mock("@sps/shared-utils", () => {
  return {
    RBAC_SECRET_KEY: "rbac-secret",
  };
});

jest.mock("@sps/backend-utils", () => {
  return {
    getHttpErrorType: (error: Error) => ({
      status: 400,
      message: error.message,
      details: null,
    }),
  };
});

jest.mock("@sps/knowledge/backend/app/api/src/lib/configuration", () => {
  return {
    getKnowledgeConfiguration: () => ({
      llm: {
        url: "http://llm.test",
      },
    }),
  };
});

jest.mock("@sps/knowledge/backend/app/api/src/lib/service", () => {
  return {
    KnowledgeService: jest.fn().mockImplementation(() => {
      return {
        ingestTranscript: (...args: unknown[]) =>
          mockKnowledgeIngestTranscript(...args),
      };
    }),
  };
});

jest.mock("@sps/knowledge/backend/app/api/src/lib/generation", () => {
  return {
    LlmChatClient: jest.fn().mockImplementation(() => {
      return {
        complete: (...args: unknown[]) => mockLlmComplete(...args),
      };
    }),
  };
});

jest.mock("@sps/social/models/message/sdk/server", () => {
  return {
    api: {
      create: (...args: unknown[]) => mockSocialModuleMessageCreate(...args),
    },
  };
});

jest.mock("@sps/social/relations/profiles-to-messages/sdk/server", () => {
  return {
    api: {
      create: (...args: unknown[]) =>
        mockSocialModuleProfilesToMessagesCreate(...args),
    },
  };
});

jest.mock("@sps/social/relations/chats-to-messages/sdk/server", () => {
  return {
    api: {
      create: (...args: unknown[]) =>
        mockSocialModuleChatsToMessagesCreate(...args),
    },
  };
});

jest.mock("@sps/social/relations/threads-to-messages/sdk/server", () => {
  return {
    api: {
      create: (...args: unknown[]) =>
        mockSocialModuleThreadsToMessagesCreate(...args),
    },
  };
});

import { Handler } from "./run";

function createContext(body: Record<string, unknown> = {}) {
  return {
    req: {
      param: (name: string) => {
        return {
          id: "subject-1",
          socialModuleProfileId: "profile-1",
          socialModuleChatId: "chat-1",
          socialModuleThreadId: "thread-1",
          socialModuleSkillId: "skill-1",
        }[name];
      },
      json: jest.fn().mockResolvedValue({
        transcript: "Video transcript",
        ...body,
      }),
    },
    json: jest.fn((payload: unknown) => payload),
  } as any;
}

function createService(
  overrides: {
    profilesToSkills?: unknown[];
  } = {},
) {
  return {
    socialModule: {
      profilesToChats: {
        find: jest.fn().mockResolvedValue([
          {
            profileId: "profile-1",
            chatId: "chat-1",
          },
        ]),
      },
      profilesToSkills: {
        find: jest.fn().mockResolvedValue(
          overrides.profilesToSkills ?? [
            {
              profileId: "profile-1",
              skillId: "skill-1",
            },
          ],
        ),
      },
      profile: {
        findById: jest.fn().mockResolvedValue({
          id: "profile-1",
          slug: "signlepagestartup",
          adminTitle: "signlepagestartup",
          description: {
            en: "Commercial real estate profile",
          },
        }),
      },
      skill: {
        findById: jest.fn().mockResolvedValue({
          id: "skill-1",
          slug: "youtube-description",
          title: "YouTube Description",
          description: "Return a YouTube description.",
          status: "active",
          defaultModelSlug: "openai/gpt-5-5",
          allowedModelSlugs: [],
        }),
      },
    },
    subjectsToRoles: {
      find: jest.fn().mockResolvedValue([]),
    },
    role: {
      find: jest.fn().mockResolvedValue([]),
    },
  } as any;
}

describe("Given: rbac social skill transcript run", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockKnowledgeIngestTranscript.mockResolvedValue({
      document: {
        id: "knowledge-document-1",
      },
      index: {
        createdChunks: 2,
      },
    });
    mockLlmComplete.mockResolvedValue({
      answer: "Generated description",
      model: "openai/gpt-5-5",
      provider: "openai",
      providerModel: "gpt-5.5",
      usage: {
        totalTokens: 42,
      },
    });
    mockSocialModuleMessageCreate
      .mockResolvedValueOnce({
        id: "user-message-1",
        description: "Skill run",
      })
      .mockResolvedValueOnce({
        id: "assistant-message-1",
        description: "Generated description",
      });
    mockSocialModuleProfilesToMessagesCreate.mockResolvedValue({});
    mockSocialModuleChatsToMessagesCreate.mockResolvedValue({});
    mockSocialModuleThreadsToMessagesCreate.mockResolvedValue({});
  });

  /**
   * BDD Scenario
   * Given: the selected skill is linked to the profile.
   * When: the skill run endpoint receives a transcript.
   * Then: Knowledge stores the transcript and the assistant message stores the generated output.
   */
  it("When: profile skill is run Then: transcript is ingested and generation is saved as assistant message", async () => {
    const handler = new Handler(createService());
    const context = createContext({
      title: "Video title",
    });

    await handler.execute(context, jest.fn());

    expect(mockKnowledgeIngestTranscript).toHaveBeenCalledWith(
      expect.objectContaining({
        profileId: "profile-1",
        chatId: "chat-1",
        threadId: "thread-1",
        skillId: "skill-1",
        skillSlug: "youtube-description",
        title: "Video title",
        transcript: "Video transcript",
      }),
    );
    expect(mockLlmComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "openai/gpt-5-5",
        messages: expect.arrayContaining([
          expect.objectContaining({
            role: "system",
            content: expect.stringContaining("Return a YouTube description."),
          }),
          expect.objectContaining({
            role: "user",
            content: expect.stringContaining("Video transcript"),
          }),
        ]),
      }),
    );
    expect(mockSocialModuleMessageCreate).toHaveBeenLastCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          description: "Generated description",
          metadata: expect.objectContaining({
            socialSkillRun: expect.objectContaining({
              role: "assistant",
              knowledgeDocumentId: "knowledge-document-1",
              modelSlug: "openai/gpt-5-5",
            }),
          }),
        }),
      }),
    );
    expect(context.json).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          knowledgeDocument: {
            id: "knowledge-document-1",
          },
        }),
      }),
    );
  });

  /**
   * BDD Scenario
   * Given: the selected skill is not linked to the profile.
   * When: the subject tries to run that skill.
   * Then: the endpoint rejects the request before Knowledge or LLM calls.
   */
  it("When: skill is not profile-bound Then: request is rejected", async () => {
    const handler = new Handler(
      createService({
        profilesToSkills: [],
      }),
    );

    await expect(handler.execute(createContext(), jest.fn())).rejects.toThrow(
      "Requested social skill is not linked to profile",
    );
    expect(mockKnowledgeIngestTranscript).not.toHaveBeenCalled();
    expect(mockLlmComplete).not.toHaveBeenCalled();
  });
});
