/**
 * BDD Suite: rbac social skill transcript run.
 *
 * Given: a social profile has profile-scoped skills.
 * When: the subject runs a selected skill from a chat thread.
 * Then: the transcript is learned by Knowledge and the generated output is saved only as chat messages.
 */

const mockKnowledgeLearnContent = jest.fn();
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
        learnContent: (...args: unknown[]) =>
          mockKnowledgeLearnContent(...args),
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
      profilesToKnowledgeModuleDocuments: {
        find: jest.fn().mockResolvedValue([]),
        create: jest.fn().mockResolvedValue({
          id: "profile-document-relation-1",
        }),
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

    mockKnowledgeLearnContent.mockResolvedValue({
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
   * Then: Knowledge stores generic transcript content and RBAC links the document to the profile.
   */
  it("When: profile skill is run Then: transcript is learned and generation is saved as assistant message", async () => {
    const service = createService();
    const handler = new Handler(service);
    const context = createContext({
      title: "Video title",
    });

    await handler.execute(context, jest.fn());

    expect(mockKnowledgeLearnContent).toHaveBeenCalledWith(
      expect.objectContaining({
        slug: expect.stringMatching(/^knowledge-profile-1-thread-1-skill-1-/),
        title: "Video title",
        content: "Video transcript",
        summary: "Transcript imported from social skill run",
        metadata: expect.objectContaining({
          sourceKind: "transcript",
          sourceSystem: "social-skill",
          socialModuleProfileId: "profile-1",
          socialModuleChatId: "chat-1",
          socialModuleThreadId: "thread-1",
          socialModuleSkillId: "skill-1",
          socialModuleSkillSlug: "youtube-description",
        }),
      }),
    );
    expect(
      service.socialModule.profilesToKnowledgeModuleDocuments.create,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          profileId: "profile-1",
          knowledgeModuleDocumentId: "knowledge-document-1",
        },
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
   * Given: the social profile description was stored as TipTap JSON.
   * When: the profile skill run prompt is built.
   * Then: the LLM receives plain profile description text instead of editor JSON.
   */
  it("When: profile description is legacy TipTap JSON Then: skill prompt uses plain text", async () => {
    const service = createService();

    service.socialModule.profile.findById.mockResolvedValue({
      id: "profile-1",
      slug: "signlepagestartup",
      adminTitle: "signlepagestartup",
      description: {
        en: JSON.stringify({
          type: "doc",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "Uses profile knowledge as business context.",
                },
              ],
            },
          ],
        }),
      },
    });

    const handler = new Handler(service);

    await handler.execute(createContext(), jest.fn());

    const userMessage = mockLlmComplete.mock.calls[0][0].messages.find(
      (message: { role: string }) => message.role === "user",
    );

    expect(userMessage.content).toContain(
      "Uses profile knowledge as business context.",
    );
    expect(userMessage.content).not.toContain('"type":"doc"');
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
    expect(mockKnowledgeLearnContent).not.toHaveBeenCalled();
    expect(mockLlmComplete).not.toHaveBeenCalled();
  });
});
