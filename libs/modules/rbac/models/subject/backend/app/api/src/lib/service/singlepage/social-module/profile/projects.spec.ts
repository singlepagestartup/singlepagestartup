import { Service } from "./projects";

function reader(rows: any[]) {
  return {
    find: jest.fn(async ({ params }: any) =>
      rows.filter((row) =>
        params.filters.and.every((filter: any) =>
          filter.method === "inArray"
            ? filter.value.includes(row[filter.column])
            : row[filter.column] === filter.value,
        ),
      ),
    ),
  };
}

function dependencies() {
  return {
    subjectsToSocialModuleProfiles: reader([
      {
        subjectId: "owner",
        socialModuleProfileId: "personal",
        variant: "default",
      },
      {
        subjectId: "owner",
        socialModuleProfileId: "assistant",
        variant: "assistant",
      },
      {
        subjectId: "other",
        socialModuleProfileId: "foreign",
        variant: "assistant",
      },
    ]),
    socialModule: {
      profile: reader([
        { id: "assistant", variant: "artificial-intelligence" },
        { id: "foreign", variant: "artificial-intelligence" },
      ]),
      profilesToChats: reader([
        { profileId: "personal", chatId: "chat" },
        { profileId: "assistant", chatId: "chat" },
        { profileId: "foreign", chatId: "chat" },
      ]),
      chat: reader([{ id: "chat" }]),
      chatsToThreads: reader([
        { chatId: "chat", threadId: "default" },
        { chatId: "chat", threadId: "products" },
        { chatId: "chat", threadId: "brief" },
        { chatId: "another-chat", threadId: "foreign-thread" },
      ]),
      thread: reader([
        { id: "default", variant: "default", metadata: {} },
        {
          id: "products",
          metadata: {
            aiChatDocument: {
              key: "products",
              profileId: "assistant",
              sourceIds: [],
            },
          },
        },
        {
          id: "brief",
          metadata: {
            aiChatDocument: {
              key: "brief",
              profileId: "assistant",
              sourceIds: [],
            },
          },
        },
        { id: "foreign-thread", metadata: {} },
      ]),
    },
  };
}

it("lists only assistant profiles owned by the Subject even when another assistant shares its Chat", async () => {
  const deps = dependencies();
  const projects = await new Service(deps as any).find({ subjectId: "owner" });
  expect(projects).toEqual([
    {
      profile: { id: "assistant", variant: "artificial-intelligence" },
      chat: { id: "chat" },
      thread: expect.objectContaining({ id: "brief" }),
      requesterProfileId: "personal",
    },
  ]);
});

it("returns an empty list for a new Subject without reading unrelated projects", async () => {
  const deps = dependencies();
  expect(await new Service(deps as any).find({ subjectId: "new" })).toEqual([]);
  expect(deps.socialModule.profile.find).not.toHaveBeenCalled();
});

it("does not expose an owned assistant's Chat without the caller's personal membership", async () => {
  const deps = dependencies();
  deps.socialModule.profilesToChats = reader([
    { profileId: "assistant", chatId: "chat" },
  ]);
  expect(await new Service(deps as any).find({ subjectId: "owner" })).toEqual(
    [],
  );
  expect(deps.socialModule.chat.find).not.toHaveBeenCalled();
});
