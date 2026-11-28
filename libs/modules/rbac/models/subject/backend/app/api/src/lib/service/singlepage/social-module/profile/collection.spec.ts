import { Service } from "./collection";

function dependencies() {
  const records = [
    { id: "human", slug: "human", variant: "default" },
    { id: "AI-one", slug: "one", variant: "artificial-intelligence" },
    { id: "AI-two", slug: "two", variant: "artificial-intelligence" },
    { id: "other-human", slug: "guest", variant: "default" },
    { id: "foreign", slug: "foreign", variant: "artificial-intelligence" },
  ];
  const deps = {
    find: jest.fn(),
    findById: jest.fn().mockResolvedValue({ id: "owner", variant: "default" }),
    socialModuleChatLifecycleIsSubjectAdmin: jest.fn().mockResolvedValue(false),
    socialModuleChatLifecycleAssertSubjectOwnsChat: jest.fn(),
    modules: {
      social: {
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
    },
    module: {
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
    },
  };
  return deps;
}

describe("Subject profile collection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it("find returns only directly owned personal and assistant profiles", async () => {
    const deps = dependencies();
    const result = await new Service(deps as any).find({ subjectId: "owner" });
    expect(result.map((profile) => profile.id)).toEqual([
      "human",
      "AI-one",
      "AI-two",
    ]);
    expect(deps.modules.social.chat.find).not.toHaveBeenCalled();
    expect(deps.modules.social.profilesToChats.find).not.toHaveBeenCalled();
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
    expect(deps.modules.social.profile.find).toHaveBeenCalledWith({
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
    deps.module.subjectsToSocialModuleProfiles.find.mockResolvedValue([]);
    expect(await new Service(deps as any).find({ subjectId: "owner" })).toEqual(
      [],
    );
    expect(deps.modules.social.profile.find).not.toHaveBeenCalled();
  });
});

it("filters owned profiles by this chat before opening an overview", async () => {
  const deps = dependencies();
  const result = await new Service(deps as any).find({
    subjectId: "owner",
    socialModuleChatId: "existing-chat",
  });
  expect(result.map((p) => p.id)).toEqual(["AI-one"]);
});
it("returns no profile for a chat none of the subject's profiles joined", async () => {
  const deps = dependencies();
  expect(
    await new Service(deps as any).find({
      subjectId: "owner",
      socialModuleChatId: "unjoined-chat",
    }),
  ).toEqual([]);
  expect(deps.modules.social.profile.find).not.toHaveBeenCalled();
});
it("preserves the existing administrator fallback using only their own profiles", async () => {
  const deps = dependencies();
  deps.socialModuleChatLifecycleIsSubjectAdmin.mockResolvedValue(true);
  const result = await new Service(deps as any).find({
    subjectId: "owner",
    socialModuleChatId: "unjoined-chat",
  });
  expect(result.map((p) => p.id)).toEqual(["human", "AI-one", "AI-two"]);
});
