const mockSubjectCreate = jest.fn();
const mockProfileCreate = jest.fn();
const mockSubjectProfileCreate = jest.fn();
const mockProfileChatCreate = jest.fn();
jest.mock("@sps/shared-utils", () => ({ RBAC_SECRET_KEY: "test-secret" }));
jest.mock("@sps/rbac/models/subject/sdk/server", () => ({
  api: { create: mockSubjectCreate },
}));
jest.mock("@sps/social/models/profile/sdk/server", () => ({
  api: { create: mockProfileCreate },
}));
jest.mock(
  "@sps/rbac/relations/subjects-to-social-module-profiles/sdk/server",
  () => ({ api: { create: mockSubjectProfileCreate } }),
);
jest.mock("@sps/social/relations/profiles-to-chats/sdk/server", () => ({
  api: { create: mockProfileChatCreate },
}));
import { Service } from "./bootstrap";

describe("AI profile bootstrap identity", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it("connects the created project profile without replacing its generated slug or admin title", async () => {
    mockSubjectCreate.mockImplementation(async ({ data }) => ({
      id: "agent",
      ...data,
    }));
    mockProfileCreate.mockImplementation(async ({ data }) => ({
      id: "profile",
      ...data,
    }));
    const profileFind = jest.fn().mockResolvedValue([]);
    const ensureKnowledgeAccess = jest.fn();
    const service = new Service({
      findSubjects: jest.fn().mockResolvedValue([]),
      socialModule: {
        profile: { find: profileFind },
        profilesToChats: { find: jest.fn().mockResolvedValue([]) },
      } as any,
      subjectsToSocialModuleProfiles: {
        find: jest.fn().mockResolvedValue([]),
      } as any,
      ensureKnowledgeAccess,
    });
    const result = await service.execute({
      ownerRbacSubject: { id: "owner", variant: "default" } as any,
      socialModuleChatId: "chat-1",
      slug: "profile-chat-1",
      socialModuleProfile: {
        id: "profile",
        slug: "automatic-profile-slug",
        adminTitle: "Automatic admin title",
        title: { en: "Project" },
        variant: "artificial-intelligence",
      } as any,
      title: "Project",
      relationVariant: "default",
    });
    expect(mockSubjectCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { variant: "agent", slug: "profile-chat-1" },
      }),
    );
    expect(mockProfileCreate).not.toHaveBeenCalled();
    expect(profileFind).not.toHaveBeenCalled();
    expect(result.socialModuleProfile.slug).toEqual("automatic-profile-slug");
    expect(result.socialModuleProfile.adminTitle).toEqual(
      "Automatic admin title",
    );
    expect(mockSubjectProfileCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          subjectId: "agent",
          socialModuleProfileId: "profile",
          variant: "default",
        },
      }),
    );
    expect(ensureKnowledgeAccess).toHaveBeenCalledWith({
      ownerRbacSubjectId: "owner",
      socialModuleProfileId: "profile",
    });
    expect(mockProfileChatCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { profileId: "profile", chatId: "chat-1", variant: "default" },
      }),
    );
  });
  it("retains the deterministic Telegram profile creation when no project profile is supplied", async () => {
    mockSubjectCreate.mockImplementation(async ({ data }) => ({
      id: "agent",
      ...data,
    }));
    mockProfileCreate.mockImplementation(async ({ data }) => ({
      id: "profile",
      ...data,
    }));
    const service = new Service({
      findSubjects: jest.fn().mockResolvedValue([]),
      socialModule: {
        profile: { find: jest.fn().mockResolvedValue([]) },
        profilesToChats: { find: jest.fn().mockResolvedValue([]) },
      } as any,
      subjectsToSocialModuleProfiles: {
        find: jest.fn().mockResolvedValue([]),
      } as any,
      ensureKnowledgeAccess: jest.fn(),
    });
    await service.execute({
      ownerRbacSubject: { id: "owner", variant: "default" } as any,
      socialModuleChatId: "telegram-chat",
      slug: "telegram-personal-ai-agent-owner",
      title: "My AI agent",
      adminTitle: "Telegram personal AI agent for owner",
      titleTranslations: { en: "My AI agent", ru: "Мой ИИ-агент" },
      relationVariant: "default",
    });
    expect(mockProfileCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          slug: "telegram-personal-ai-agent-owner",
          adminTitle: "Telegram personal AI agent for owner",
          title: { en: "My AI agent", ru: "Мой ИИ-агент" },
          variant: "artificial-intelligence",
        }),
      }),
    );
  });
  it("rejects a supplied profile owned by another agent before connecting it to the chat", async () => {
    const service = new Service({
      findSubjects: jest
        .fn()
        .mockResolvedValue([{ id: "agent", variant: "agent" }]),
      socialModule: {
        profilesToChats: { find: jest.fn().mockResolvedValue([]) },
      } as any,
      subjectsToSocialModuleProfiles: {
        find: jest.fn().mockResolvedValue([
          {
            subjectId: "foreign-agent",
            socialModuleProfileId: "foreign-profile",
          },
        ]),
      } as any,
      ensureKnowledgeAccess: jest.fn(),
    });
    await expect(
      service.execute({
        ownerRbacSubject: { id: "owner", variant: "default" } as any,
        socialModuleChatId: "chat",
        slug: "profile-chat",
        socialModuleProfile: {
          id: "foreign-profile",
          variant: "artificial-intelligence",
        } as any,
        title: "Project",
        relationVariant: "default",
      }),
    ).rejects.toThrow("another rbac.subject");
    expect(mockSubjectProfileCreate).not.toHaveBeenCalled();
    expect(mockProfileChatCreate).not.toHaveBeenCalled();
  });
});
