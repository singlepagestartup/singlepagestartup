/**
 * BDD Suite: Chat-local agent profile creation.
 *
 * Given: a user adds an rbac.subject with variant="agent" to a chat.
 * When: the RBAC chat profile create handler receives agentSubjectId.
 * Then: it creates an empty artificial-intelligence social.profile linked only to that chat.
 */

const mockSocialModuleProfileCreate = jest.fn();
const mockSocialModuleProfilesToChatsCreate = jest.fn();
const mockSubjectsToSocialModuleProfilesCreate = jest.fn();
const mockCreateId = jest.fn();

jest.mock("@sps/shared-utils", () => ({
  RBAC_JWT_SECRET: "jwt-secret",
  RBAC_SECRET_KEY: "rbac-secret",
}));

jest.mock("@sps/backend-utils", () => ({
  getHttpErrorType: (error: Error) => ({
    status: 400,
    message: error.message,
    details: null,
  }),
}));

jest.mock("@sps/shared-configuration", () => ({
  internationalization: {
    defaultLanguage: {
      code: "en",
    },
  },
}));

jest.mock("@paralleldrive/cuid2", () => ({
  createId: () => mockCreateId(),
}));

jest.mock("@sps/social/models/profile/sdk/server", () => ({
  api: {
    create: (...args: unknown[]) => mockSocialModuleProfileCreate(...args),
  },
}));

jest.mock("@sps/social/relations/profiles-to-chats/sdk/server", () => ({
  api: {
    create: (...args: unknown[]) =>
      mockSocialModuleProfilesToChatsCreate(...args),
  },
}));

jest.mock(
  "@sps/rbac/relations/subjects-to-social-module-profiles/sdk/server",
  () => ({
    api: {
      create: (...args: unknown[]) =>
        mockSubjectsToSocialModuleProfilesCreate(...args),
    },
  }),
);

import { Handler } from "./create";

function createContext(data: Record<string, unknown>, chatId = "chat-1") {
  return {
    req: {
      param: (name: string) => {
        return {
          id: "subject-1",
          socialModuleChatId: chatId,
        }[name];
      },
      parseBody: jest.fn().mockResolvedValue({
        data: JSON.stringify(data),
      }),
    },
    json: jest.fn((payload: unknown) => payload),
  } as any;
}

function createService(props: { agentVariant?: string } = {}) {
  return {
    socialModuleChatLifecycleAssertSubjectOwnsChat: jest
      .fn()
      .mockResolvedValue(undefined),
    findById: jest.fn().mockResolvedValue({
      id: "agent-subject-1",
      slug: "maxim-ivanov",
      variant: props.agentVariant || "agent",
    }),
    subjectsToSocialModuleProfiles: {
      find: jest.fn().mockResolvedValue([]),
    },
    socialModule: {
      profile: {
        findById: jest.fn(),
        find: jest.fn().mockResolvedValue([]),
      },
      profilesToChats: {
        find: jest.fn().mockResolvedValue([]),
      },
    },
  } as any;
}

describe("Given: Chat-local agent profile creation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateId.mockReturnValue("generated-profile-id");
    mockSocialModuleProfileCreate.mockResolvedValue({
      id: "social-profile-1",
      slug: "maxim-ivanov-generated",
      variant: "artificial-intelligence",
    });
    mockSubjectsToSocialModuleProfilesCreate.mockResolvedValue({
      id: "subject-profile-1",
    });
    mockSocialModuleProfilesToChatsCreate.mockResolvedValue({
      id: "profile-chat-1",
      profileId: "social-profile-1",
      chatId: "chat-1",
    });
  });

  /**
   * BDD Scenario
   * Given: the target RBAC subject has variant agent.
   * When: it is added to a chat through agentSubjectId.
   * Then: a new empty AI social profile is created and linked to the chat.
   */
  it("When: adding agentSubjectId Then: creates an empty AI profile for that chat", async () => {
    const service = createService();
    const handler = new Handler(service);

    const response = await handler.execute(
      createContext({ agentSubjectId: "agent-subject-1" }),
      jest.fn(),
    );

    expect(
      service.socialModuleChatLifecycleAssertSubjectOwnsChat,
    ).toHaveBeenCalledWith({
      subjectId: "subject-1",
      socialModuleChatId: "chat-1",
    });
    expect(mockSocialModuleProfileCreate).toHaveBeenCalledWith({
      data: {
        variant: "artificial-intelligence",
        className: "",
        adminTitle: "maxim-ivanov",
        slug: "maxim-ivanov-generate",
        title: {
          en: "maxim-ivanov",
        },
        subtitle: {},
        description: {},
      },
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": "rbac-secret",
        },
      },
    });
    expect(mockSubjectsToSocialModuleProfilesCreate).toHaveBeenCalledWith({
      data: {
        subjectId: "agent-subject-1",
        socialModuleProfileId: "social-profile-1",
      },
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": "rbac-secret",
        },
      },
    });
    expect(mockSocialModuleProfilesToChatsCreate).toHaveBeenCalledWith({
      data: {
        profileId: "social-profile-1",
        chatId: "chat-1",
      },
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": "rbac-secret",
        },
      },
    });
    expect(response).toEqual({
      data: {
        id: "profile-chat-1",
        profileId: "social-profile-1",
        chatId: "chat-1",
      },
    });
  });

  /**
   * BDD Scenario
   * Given: the same agent subject is added to different chats.
   * When: there is no existing profile-to-chat relation in each chat.
   * Then: a fresh AI profile is created for each chat instead of sharing one profile.
   */
  it("When: adding the same agent to different chats Then: creates separate profiles", async () => {
    const handler = new Handler(createService());

    await handler.execute(
      createContext({ agentSubjectId: "agent-subject-1" }, "chat-1"),
      jest.fn(),
    );
    await handler.execute(
      createContext({ agentSubjectId: "agent-subject-1" }, "chat-2"),
      jest.fn(),
    );

    expect(mockSocialModuleProfileCreate).toHaveBeenCalledTimes(2);
    expect(mockSocialModuleProfilesToChatsCreate).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        data: expect.objectContaining({
          chatId: "chat-2",
        }),
      }),
    );
  });

  /**
   * BDD Scenario
   * Given: a non-agent RBAC subject id is submitted as agentSubjectId.
   * When: the handler validates the target subject.
   * Then: profile creation is rejected before any social.profile mutation.
   */
  it("When: adding non-agent subject Then: rejects profile creation", async () => {
    const handler = new Handler(createService({ agentVariant: "default" }));

    await expect(
      handler.execute(
        createContext({ agentSubjectId: "agent-subject-1" }),
        jest.fn(),
      ),
    ).rejects.toThrow('Requested subject must have variant="agent"');

    expect(mockSocialModuleProfileCreate).not.toHaveBeenCalled();
    expect(mockSubjectsToSocialModuleProfilesCreate).not.toHaveBeenCalled();
    expect(mockSocialModuleProfilesToChatsCreate).not.toHaveBeenCalled();
  });
});
