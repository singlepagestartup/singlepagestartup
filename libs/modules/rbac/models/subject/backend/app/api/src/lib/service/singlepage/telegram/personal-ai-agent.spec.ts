/**
 * BDD Suite: Telegram personal AI agent provisioning.
 *
 * Given: a Telegram user already has an owner rbac.subject and Telegram chat.
 * When: the personal agent lifecycle is ensured.
 * Then: exactly one agent subject and one empty AI profile are reused and connected to the chat.
 */

const mockRbacSubjectCreate = jest.fn();
const mockSocialModuleProfileCreate = jest.fn();
const mockSubjectsToSocialModuleProfilesCreate = jest.fn();
const mockSubjectsToSocialModuleProfilesDelete = jest.fn();
const mockSocialModuleProfilesToChatsCreate = jest.fn();
const mockSocialModuleProfilesToChatsDelete = jest.fn();
const mockEnsureKnowledgeAccess = jest.fn();

jest.mock("@sps/shared-utils", () => ({
  RBAC_SECRET_KEY: "rbac-secret",
}));

jest.mock("@sps/rbac/models/subject/sdk/server", () => ({
  api: {
    create: (...args: unknown[]) => mockRbacSubjectCreate(...args),
  },
}));

jest.mock("@sps/social/models/profile/sdk/server", () => ({
  api: {
    create: (...args: unknown[]) => mockSocialModuleProfileCreate(...args),
  },
}));

jest.mock(
  "@sps/rbac/relations/subjects-to-social-module-profiles/sdk/server",
  () => ({
    api: {
      create: (...args: unknown[]) =>
        mockSubjectsToSocialModuleProfilesCreate(...args),
      delete: (...args: unknown[]) =>
        mockSubjectsToSocialModuleProfilesDelete(...args),
    },
  }),
);

jest.mock("@sps/social/relations/profiles-to-chats/sdk/server", () => ({
  api: {
    create: (...args: unknown[]) =>
      mockSocialModuleProfilesToChatsCreate(...args),
    delete: (...args: unknown[]) =>
      mockSocialModuleProfilesToChatsDelete(...args),
  },
}));

import { Service } from "./personal-ai-agent";

const ownerRbacSubject = {
  id: "owner-subject-1",
  slug: "telegram-user-1",
  variant: "default",
} as any;
const personalAgentSlug = "telegram-personal-ai-agent-owner-subject-1";

describe("Given: Telegram personal AI agent provisioning", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRbacSubjectCreate.mockResolvedValue({
      id: "agent-subject-1",
      slug: personalAgentSlug,
      variant: "agent",
    });
    mockSocialModuleProfileCreate.mockResolvedValue({
      id: "agent-profile-1",
      slug: personalAgentSlug,
      variant: "artificial-intelligence",
      description: {},
      allowedMcpServerIds: ["singlepagestartup"],
    });
    mockSubjectsToSocialModuleProfilesCreate.mockResolvedValue({
      id: "subject-profile-1",
    });
    mockSocialModuleProfilesToChatsCreate.mockResolvedValue({
      id: "profile-chat-1",
    });
    mockEnsureKnowledgeAccess.mockResolvedValue({});
  });

  /**
   * BDD Scenario
   * Given: the owner has no personal AI subject or profile.
   * When: provisioning runs for the first Telegram interaction.
   * Then: it creates a dedicated agent subject and a knowledge-empty profile with project MCP access.
   */
  it("When: no personal agent exists Then: creates the isolated subject and empty AI profile", async () => {
    const findSubjects = jest.fn().mockResolvedValue([]);
    const subjectsToSocialModuleProfiles = {
      find: jest.fn().mockResolvedValue([]),
    };
    const socialModule = {
      profile: {
        find: jest.fn().mockResolvedValue([]),
      },
      profilesToChats: {
        find: jest.fn().mockResolvedValue([]),
      },
      profilesToKnowledgeModuleDocuments: {
        create: jest.fn(),
      },
    } as any;
    const service = new Service({
      findSubjects,
      subjectsToSocialModuleProfiles: subjectsToSocialModuleProfiles as any,
      socialModule,
      ensureKnowledgeAccess: mockEnsureKnowledgeAccess,
    });

    await expect(
      service.execute({
        ownerRbacSubject,
        socialModuleChatId: "chat-1",
      }),
    ).resolves.toEqual({
      rbacModuleSubject: expect.objectContaining({
        id: "agent-subject-1",
        variant: "agent",
      }),
      socialModuleProfile: expect.objectContaining({
        id: "agent-profile-1",
        variant: "artificial-intelligence",
      }),
    });
    expect(mockRbacSubjectCreate).toHaveBeenCalledWith({
      data: {
        variant: "agent",
        slug: personalAgentSlug,
      },
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": "rbac-secret",
          "Cache-Control": "no-store",
        },
      },
    });
    expect(mockSocialModuleProfileCreate).toHaveBeenCalledWith({
      data: {
        variant: "artificial-intelligence",
        className: "",
        adminTitle: "Telegram personal AI agent for telegram-user-1",
        slug: personalAgentSlug,
        title: {
          en: "My AI agent",
          ru: "Мой ИИ-агент",
        },
        subtitle: {},
        description: {},
        allowedMcpServerIds: ["singlepagestartup"],
      },
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": "rbac-secret",
          "Cache-Control": "no-store",
        },
      },
    });
    expect(mockSubjectsToSocialModuleProfilesCreate).toHaveBeenCalledWith({
      data: {
        subjectId: "agent-subject-1",
        socialModuleProfileId: "agent-profile-1",
        variant: "telegram-personal-ai-agent",
      },
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": "rbac-secret",
          "Cache-Control": "no-store",
        },
      },
    });
    expect(mockSocialModuleProfilesToChatsCreate).toHaveBeenCalledWith({
      data: {
        profileId: "agent-profile-1",
        chatId: "chat-1",
        variant: "telegram-personal-ai-agent",
      },
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": "rbac-secret",
          "Cache-Control": "no-store",
        },
      },
    });
    expect(
      socialModule.profilesToKnowledgeModuleDocuments.create,
    ).not.toHaveBeenCalled();
    expect(mockEnsureKnowledgeAccess).toHaveBeenCalledWith({
      ownerRbacSubjectId: "owner-subject-1",
      socialModuleProfileId: "agent-profile-1",
    });
  });

  /**
   * BDD Scenario
   * Given: the owner already has its deterministic agent subject, profile, and chat relation.
   * When: another Telegram update runs provisioning.
   * Then: all records are reused without creating a second agent or Knowledge relation.
   */
  it("When: personal agent already exists Then: reuses every persisted record", async () => {
    const existingSubject = {
      id: "agent-subject-1",
      slug: personalAgentSlug,
      variant: "agent",
    };
    const existingProfile = {
      id: "agent-profile-1",
      slug: personalAgentSlug,
      variant: "artificial-intelligence",
    };
    const service = new Service({
      findSubjects: jest.fn().mockResolvedValue([existingSubject]) as any,
      subjectsToSocialModuleProfiles: {
        find: jest.fn().mockResolvedValue([
          {
            id: "subject-profile-1",
            subjectId: "agent-subject-1",
            socialModuleProfileId: "agent-profile-1",
          },
        ]),
      } as any,
      socialModule: {
        profile: {
          find: jest.fn().mockResolvedValue([existingProfile]),
        },
        profilesToChats: {
          find: jest.fn().mockResolvedValue([
            {
              id: "profile-chat-1",
              profileId: "agent-profile-1",
              chatId: "chat-1",
            },
          ]),
        },
      } as any,
      ensureKnowledgeAccess: mockEnsureKnowledgeAccess,
    });

    await expect(
      service.execute({
        ownerRbacSubject,
        socialModuleChatId: "chat-1",
      }),
    ).resolves.toEqual({
      rbacModuleSubject: existingSubject,
      socialModuleProfile: existingProfile,
    });
    expect(mockRbacSubjectCreate).not.toHaveBeenCalled();
    expect(mockSocialModuleProfileCreate).not.toHaveBeenCalled();
    expect(mockSubjectsToSocialModuleProfilesCreate).not.toHaveBeenCalled();
    expect(mockSocialModuleProfilesToChatsCreate).not.toHaveBeenCalled();
    expect(mockSubjectsToSocialModuleProfilesDelete).not.toHaveBeenCalled();
    expect(mockSocialModuleProfilesToChatsDelete).not.toHaveBeenCalled();
    expect(mockEnsureKnowledgeAccess).toHaveBeenCalledWith({
      ownerRbacSubjectId: "owner-subject-1",
      socialModuleProfileId: "agent-profile-1",
    });
  });
});
