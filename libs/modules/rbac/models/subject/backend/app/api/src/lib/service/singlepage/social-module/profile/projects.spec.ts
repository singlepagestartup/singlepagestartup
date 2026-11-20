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
    module: {
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
    },
    modules: {
      social: {
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
          {
            chatId: "chat",
            threadId: "products",
            variant: "ai-chat",
            orderIndex: 0,
          },
          {
            chatId: "chat",
            threadId: "brief",
            variant: "ai-chat",
            orderIndex: 1,
          },
          {
            chatId: "chat",
            threadId: "default",
            variant: "default",
            orderIndex: 2,
          },
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
    },
  };
}

it("opens the default relation of an owned project with former document threads and a shared assistant", async () => {
  const deps = dependencies();
  const projects = await new Service(deps as any).find({ subjectId: "owner" });
  expect(projects).toEqual([
    {
      profile: { id: "assistant", variant: "artificial-intelligence" },
      chat: { id: "chat" },
      thread: expect.objectContaining({ id: "default" }),
      requesterProfileId: "personal",
    },
  ]);
});

it("uses the first linked thread by relation order for a project without a default relation", async () => {
  const deps = dependencies();
  deps.modules.social.chatsToThreads = reader([
    { chatId: "chat", threadId: "brief", variant: "ai-chat", orderIndex: 2 },
    { chatId: "chat", threadId: "products", variant: "ai-chat", orderIndex: 1 },
  ]);

  const projects = await new Service(deps as any).find({ subjectId: "owner" });

  expect(projects[0].thread.id).toBe("products");
});

it("returns an empty list for a new Subject without reading unrelated projects", async () => {
  const deps = dependencies();
  expect(await new Service(deps as any).find({ subjectId: "new" })).toEqual([]);
  expect(deps.modules.social.profile.find).not.toHaveBeenCalled();
});

it("does not expose an owned assistant's Chat without the caller's personal membership", async () => {
  const deps = dependencies();
  deps.modules.social.profilesToChats = reader([
    { profileId: "assistant", chatId: "chat" },
  ]);
  expect(await new Service(deps as any).find({ subjectId: "owner" })).toEqual(
    [],
  );
  expect(deps.modules.social.chat.find).not.toHaveBeenCalled();
});
