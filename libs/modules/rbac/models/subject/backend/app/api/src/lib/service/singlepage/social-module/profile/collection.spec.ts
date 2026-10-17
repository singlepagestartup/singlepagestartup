const mockBootstrap = jest.fn();
const mockDocuments = jest.fn();
const mockEnsure = jest.fn();
jest.mock("./skills", () => ({
  Service: class {
    ensure = mockEnsure;
  },
}));
jest.mock("./documents", () => ({
  Service: class {
    execute = mockDocuments;
  },
}));
const mockProfileCreate = jest.fn();
const mockProfileDelete = jest.fn();
const mockRelationCreate = jest.fn();
jest.mock("./ai/bootstrap", () => ({
  Service: class {
    execute = mockBootstrap;
  },
}));
jest.mock("@sps/shared-utils", () => ({ RBAC_SECRET_KEY: "test-secret" }));
jest.mock("@sps/social/models/profile/sdk/server", () => ({
  api: { create: mockProfileCreate, delete: mockProfileDelete },
}));
jest.mock(
  "@sps/rbac/relations/subjects-to-social-module-profiles/sdk/server",
  () => ({ api: { create: mockRelationCreate } }),
);
import { Service } from "./collection";

function dependencies() {
  let nextChatId = 0;
  const records = [
    { id: "human", slug: "human", variant: "default" },
    { id: "AI-one", slug: "one", variant: "artificial-intelligence" },
    { id: "AI-two", slug: "two", variant: "artificial-intelligence" },
    { id: "other-human", slug: "guest", variant: "default" },
    { id: "foreign", slug: "foreign", variant: "artificial-intelligence" },
  ];
  const deps = {
    find: jest.fn(),
    subjectsToIdentities: {
      find: jest
        .fn()
        .mockResolvedValue([{ subjectId: "owner", identityId: "identity" }]),
    },
    findById: jest.fn().mockResolvedValue({ id: "owner", variant: "default" }),
    subjectsToSocialModuleProfiles: {
      find: jest.fn().mockResolvedValue([
        {
          subjectId: "owner",
          socialModuleProfileId: "human",
          variant: "default",
        },
        {
          subjectId: "owner",
          socialModuleProfileId: "AI-one",
          variant: "assistant",
        },
        {
          subjectId: "owner",
          socialModuleProfileId: "AI-two",
          variant: "assistant",
        },
      ]),
    },
    socialModule: {
      chat: { find: jest.fn().mockResolvedValue([]) },
      profilesToChats: {
        find: jest.fn().mockImplementation(({ params }) =>
          Promise.resolve(
            params.filters.and.length > 1
              ? [{ profileId: "AI-one", chatId: "existing-chat" }]
              : params.filters.and[0].column === "profileId"
                ? [{ profileId: "human", chatId: "chat" }]
                : [
                    { profileId: "human", chatId: "chat" },
                    { profileId: "AI-one", chatId: "chat" },
                    { profileId: "AI-two", chatId: "chat" },
                    { profileId: "other-human", chatId: "chat" },
                  ],
          ),
        ),
      },
      profile: {
        find: jest
          .fn()
          .mockImplementation(({ params }) =>
            Promise.resolve(
              records.filter((record) =>
                params.filters.and.every((filter: any) =>
                  filter.method === "eq"
                    ? (record as any)[filter.column] === filter.value
                    : filter.value.includes((record as any)[filter.column]),
                ),
              ),
            ),
          ),
      },
    },
    socialModuleChatLifecycleAssertSubjectOwnsChat: jest.fn(),
    socialModuleChatLifecycleCreateChatWithDefaultThread: jest
      .fn()
      .mockImplementation(async () => ({
        socialModuleChat: { id: `chat-${++nextChatId}` },
        socialModuleDefaultThread: { id: "thread", metadata: { saved: true } },
      })),
    socialModuleProfileKnowledgeAccessEnsure: jest.fn(),
  };
  return deps;
}

describe("Subject profile collection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockEnsure.mockResolvedValue([]);
    mockProfileDelete.mockResolvedValue(undefined);
    mockBootstrap.mockImplementation(async ({ socialModuleProfile }) => ({
      socialModuleProfile,
    }));
    mockProfileCreate.mockImplementation(async ({ data }) => ({
      id: `profile-${mockProfileCreate.mock.calls.length}`,
      slug: `automatic-slug-${mockProfileCreate.mock.calls.length}`,
      adminTitle: "Automatic admin title",
      ...data,
    }));
  });
  it("find returns only directly owned personal and assistant profiles", async () => {
    const deps = dependencies();
    const result = await new Service(deps as any).find({ subjectId: "owner" });
    expect(result.map((profile) => profile.id)).toEqual([
      "human",
      "AI-one",
      "AI-two",
    ]);
    expect(deps.socialModule.chat.find).not.toHaveBeenCalled();
    expect(deps.socialModule.profilesToChats.find).not.toHaveBeenCalled();
    expect(mockBootstrap).not.toHaveBeenCalled();
    expect(
      deps.socialModuleChatLifecycleCreateChatWithDefaultThread,
    ).not.toHaveBeenCalled();
  });
  it("applies caller filters and pagination inside the permitted profile IDs", async () => {
    const deps = dependencies();
    const params = {
      filters: {
        and: [
          { column: "variant", method: "eq", value: "artificial-intelligence" },
        ],
      },
      limit: 10,
      offset: 1,
      orderBy: { and: [{ column: "createdAt", method: "desc" }] },
    };
    const result = await new Service(deps as any).find({
      subjectId: "owner",
      params,
    });
    expect(result.map((profile) => profile.id)).toEqual(["AI-one", "AI-two"]);
    expect(deps.socialModule.profile.find).toHaveBeenCalledWith({
      params: {
        ...params,
        filters: {
          and: [
            ...params.filters.and,
            {
              column: "id",
              method: "inArray",
              value: ["human", "AI-one", "AI-two"],
            },
          ],
        },
      },
    });
  });
  it("an explicit foreign profile filter cannot escape the subject scope", async () => {
    const deps = dependencies();
    expect(
      await new Service(deps as any).find({
        subjectId: "owner",
        params: {
          filters: { and: [{ column: "id", method: "eq", value: "foreign" }] },
        },
      }),
    ).toEqual([]);
  });
  it("an unlinked subject receives an empty collection without an unscoped profile query", async () => {
    const deps = dependencies();
    deps.subjectsToSocialModuleProfiles.find.mockResolvedValue([]);
    expect(await new Service(deps as any).find({ subjectId: "owner" })).toEqual(
      [],
    );
    expect(deps.socialModule.profile.find).not.toHaveBeenCalled();
  });
  it("rejects manually creating another personal profile before any write", async () => {
    const deps = dependencies();
    await expect(
      new Service(deps as any).create({
        subjectId: "owner",
        data: {
          variant: "default",
          title: { en: "Profile" },
        },
      }),
    ).rejects.toThrow("personal profile is created during registration");
    expect(mockProfileCreate).not.toHaveBeenCalled();
    expect(mockRelationCreate).not.toHaveBeenCalled();
    expect(mockBootstrap).not.toHaveBeenCalled();
  });
  it("cleans up the new profile and stops setup when creating its skills fails", async () => {
    mockEnsure.mockRejectedValueOnce(new Error("Skill creation failed"));
    await expect(
      new Service(dependencies() as any).create({
        subjectId: "owner",
        data: { variant: "artificial-intelligence", title: { en: "Project" } },
      }),
    ).rejects.toThrow("Skill creation failed");
    expect(mockProfileDelete).toHaveBeenCalledWith(
      expect.objectContaining({ id: "profile-1" }),
    );
    expect(mockBootstrap).not.toHaveBeenCalled();
    expect(mockRelationCreate).not.toHaveBeenCalled();
    expect(mockDocuments).not.toHaveBeenCalled();
  });
  it("two projects with the same title receive distinct profiles, conversations and agent identities", async () => {
    const deps = dependencies();
    const svc = new Service(deps as any);
    const first = await svc.create({
      subjectId: "owner",
      data: {
        variant: "artificial-intelligence",
        title: { en: "Project" },
      },
    });
    const second = await svc.create({
      subjectId: "owner",
      data: {
        variant: "artificial-intelligence",
        title: { en: "Project" },
      },
    });
    expect(first.id).not.toBe(second.id);
    expect(
      mockBootstrap.mock.calls.map(([props]) => props.socialModuleChatId),
    ).toEqual(["chat-1", "chat-2"]);
    expect(mockBootstrap.mock.calls.map(([props]) => props.slug)).toEqual([
      "profile-chat-1",
      "profile-chat-2",
    ]);
    expect(mockProfileCreate).toHaveBeenCalledTimes(2);
    expect(mockRelationCreate).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        data: {
          subjectId: "owner",
          socialModuleProfileId: first.id,
          variant: "assistant",
        },
      }),
    );
    expect(mockRelationCreate).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        data: {
          subjectId: "owner",
          socialModuleProfileId: second.id,
          variant: "assistant",
        },
      }),
    );
    expect(mockProfileCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          variant: "artificial-intelligence",
          title: { en: "Project" },
          allowedMcpServerIds: ["singlepagestartup"],
        },
      }),
    );
    expect(
      deps.socialModuleChatLifecycleCreateChatWithDefaultThread,
    ).toHaveBeenCalledWith({
      subjectId: "owner",
      data: { title: "Project", variant: "ai-chat" },
      autoBootstrapProfile: true,
    });
    expect(mockBootstrap.mock.calls[0][0].socialModuleProfile).toBe(first);
    expect(mockBootstrap.mock.calls[1][0].socialModuleProfile).toBe(second);
    expect(mockEnsure).toHaveBeenCalledWith(first.id);
    expect(mockEnsure).toHaveBeenCalledWith(second.id);
    expect(first).not.toHaveProperty("thread");
    expect(first).not.toHaveProperty("chat");
    expect(
      mockDocuments.mock.calls.map(([props]) => ({
        profileId: props.profileId,
        chatId: props.chatId,
      })),
    ).toEqual([
      { profileId: first.id, chatId: "chat-1" },
      { profileId: second.id, chatId: "chat-2" },
    ]);
  });

  it("waits for private Skill setup before publishing assistant ownership and documents", async () => {
    let finish: (value: any[]) => void = () => {};
    mockEnsure.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    const creation = new Service(dependencies() as any).create({
      subjectId: "owner",
      data: { variant: "artificial-intelligence", title: { en: "Project" } },
    });
    for (let step = 0; step < 5; step++) await Promise.resolve();
    expect(mockEnsure).toHaveBeenCalledWith("profile-1");
    expect(mockRelationCreate).not.toHaveBeenCalled();
    expect(mockDocuments).not.toHaveBeenCalled();
    finish([]);
    await creation;
    expect(mockRelationCreate).toHaveBeenCalledTimes(1);
    expect(mockDocuments).toHaveBeenCalledTimes(1);
  });
  it("ignores caller slug and admin title instead of selecting another profile", async () => {
    const deps = dependencies();
    const profile = await new Service(deps as any).create({
      subjectId: "owner",
      data: {
        variant: "artificial-intelligence",
        slug: "foreign",
        adminTitle: "Caller override",
        title: { en: "One" },
      } as any,
    });
    expect(profile.slug).toBe("automatic-slug-1");
    expect(profile.adminTitle).toBe("Automatic admin title");
    expect(deps.socialModule.profile.find).not.toHaveBeenCalled();
    expect(deps.socialModule.chat.find).not.toHaveBeenCalled();
    expect(mockProfileCreate.mock.calls[0][0].data).not.toHaveProperty("slug");
    expect(mockProfileCreate.mock.calls[0][0].data).not.toHaveProperty(
      "adminTitle",
    );
  });
  it("rejects an unsupported variant before creating records", async () => {
    const deps = dependencies();
    await expect(
      new Service(deps as any).create({
        subjectId: "owner",
        data: {
          variant: "agent" as any,
          title: { en: "Other" },
        },
      }),
    ).rejects.toThrow("Unsupported profile variant");
    expect(mockProfileCreate).not.toHaveBeenCalled();
    expect(mockBootstrap).not.toHaveBeenCalled();
    expect(
      deps.socialModuleChatLifecycleCreateChatWithDefaultThread,
    ).not.toHaveBeenCalled();
  });
  it("rejects an empty project title before creating records", async () => {
    const deps = dependencies();
    await expect(
      new Service(deps as any).create({
        subjectId: "owner",
        data: {
          variant: "artificial-intelligence",
          title: { en: "  " },
        },
      }),
    ).rejects.toThrow("Profile title must contain 1 to 200 characters");
    expect(mockProfileCreate).not.toHaveBeenCalled();
    expect(mockBootstrap).not.toHaveBeenCalled();
    expect(
      deps.socialModuleChatLifecycleCreateChatWithDefaultThread,
    ).not.toHaveBeenCalled();
  });
  it("an anonymous subject cannot create a profile", async () => {
    const deps = dependencies();
    deps.findById.mockResolvedValue({ id: "anonymous", variant: "default" });
    deps.subjectsToIdentities.find.mockResolvedValue([]);
    await expect(
      new Service(deps as any).create({
        subjectId: "anonymous",
        data: {
          variant: "artificial-intelligence",
          title: { en: "Profile" },
        },
      }),
    ).rejects.toThrow("Sign in");
    expect(mockProfileCreate).not.toHaveBeenCalled();
    expect(mockBootstrap).not.toHaveBeenCalled();
  });
});
