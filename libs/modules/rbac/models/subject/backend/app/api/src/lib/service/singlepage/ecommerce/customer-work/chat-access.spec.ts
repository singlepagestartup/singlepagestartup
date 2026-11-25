import { Service } from "./index";

const chats = [
  { id: "ordinary", variant: "default" },
  { id: "multi-thread", variant: "default" },
  { id: "own-order", variant: "customer-work" },
  { id: "other-order", variant: "default" },
  { id: "orphan", variant: "customer-work" },
  { id: "ambiguous", variant: "customer-work" },
];

const trainingChat = {
  id: "training",
  variant: "store-employee",
  sourceSystemId: "store:viewer:employee",
  slug: "training-slug",
};
function fixture() {
  const links = [
    { chatId: "own-order", threadId: "first", crmModuleTaskId: "mine" },
    { chatId: "other-order", threadId: "second", crmModuleTaskId: "theirs" },
    { chatId: "ambiguous", threadId: "third", crmModuleTaskId: "also-mine" },
    { chatId: "ambiguous", threadId: "fourth", crmModuleTaskId: "theirs" },
    {
      chatId: "multi-thread",
      threadId: "fifth",
      crmModuleTaskId: "consultation",
    },
  ];
  const social = {
    chat: {
      findById: jest.fn(async ({ id }) =>
        [...chats, trainingChat].find((chat) => chat.id === id),
      ),
    },
    chatsToCrmModuleTasks: {
      find: jest.fn(async ({ params }) => {
        const filter = params.filters.and[0];
        expect(filter.column).toBe("chatId");
        return links.filter(({ chatId }) => filter.value.includes(chatId));
      }),
      forThread: jest.fn(async (threadId: string) =>
        links.find((link) => link.threadId === threadId),
      ),
    },
  };
  const find = jest.fn(async () => [
    { id: "mine", customerId: "viewer" },
    { id: "also-mine", customerId: "viewer" },
    { id: "consultation", customerId: "viewer" },
  ]);
  const scopeForChat = async (subjectId: string) => {
    if (subjectId !== "viewer") {
      throw new Error("Not Found error. Employee training chat is unavailable");
    }
    return { profileId: "employee-profile" };
  };
  const owners = new Set<string>();
  const chatOwnership = {
    isOwner: async (id: string, chatId: string) =>
      owners.has(id + ":" + chatId),
    assertOwner: async (id: string, chatId: string) => {
      if (!owners.has(id + ":" + chatId)) {
        throw new Error("Forbidden error. Chat owner required");
      }
    },
  };
  const service = new Service({
    chatOwnership,
    modules: { social, crm: { task: { find } } },
    crmWorkspace: { employees: { scopeForChat } },
  } as unknown as ConstructorParameters<typeof Service>[0]);
  return { service, find, owners };
}
it("recognizes the customer's order and ordinary chats while excluding foreign, incomplete and ambiguous orders", async () => {
  const { service, find } = fixture();
  expect([...(await service.chatAccess("viewer", chats)).keys()]).toEqual([
    "ordinary",
    "multi-thread",
    "own-order",
  ]);
  expect(find).toHaveBeenCalledTimes(1);
});

it("lists a training chat for its actor and only allows edits to the exact employee's sidebar", async () => {
  const { service } = fixture();
  expect(
    (await service.chatAccess("viewer", [trainingChat])).get(trainingChat.id),
  ).toBe("employee-training");
  expect(
    (await service.chatAccess("customer", [trainingChat])).has(trainingChat.id),
  ).toBe(false);
  const access = { subjectId: "viewer", chatId: trainingChat.id, edit: true };
  await expect(service.assertChatAccess(access)).rejects.toThrow("Forbidden");
  await expect(
    service.assertChatAccess({
      ...access,
      targetProfileId: "employee-profile",
    }),
  ).resolves.toBeUndefined();
  await expect(
    service.assertChatAccess({ ...access, targetProfileId: "another-profile" }),
  ).rejects.toThrow("Forbidden");
});

it("keeps ordinary sibling threads editable when a conversation enters CRM", async () => {
  const { service } = fixture();
  const scope = { subjectId: "viewer", chatId: "multi-thread", edit: true };
  await expect(
    service.assertChatAccess({ ...scope, threadId: "fifth" }),
  ).rejects.toThrow("Forbidden");
  await expect(
    service.assertChatAccess({ ...scope, threadId: "sixth" }),
  ).resolves.toBeUndefined();
});
it("applies the same ownership rule on a direct read and keeps customer edits on their dedicated route", async () => {
  const { service } = fixture();
  const scope = { subjectId: "viewer", edit: false };
  await expect(
    service.assertChatAccess({ ...scope, chatId: "other-order" }),
  ).rejects.toThrow("Not Found");
  await expect(
    service.assertChatAccess({ ...scope, chatId: "own-order" }),
  ).resolves.toBeUndefined();
  await expect(
    service.assertChatAccess({ ...scope, chatId: "own-order", edit: true }),
  ).rejects.toThrow("Forbidden");
});

it("requires the actor's explicit owner link for ordinary chat, roster and thread settings", async () => {
  const { service, owners } = fixture();
  owners.add("creator:ordinary");
  owners.add("member:another-chat");
  for (const operation of [
    "update-chat",
    "delete-chat",
    "members",
    "create-thread",
    "update-thread",
    "delete-thread",
  ]) {
    const props = {
      chatId: "ordinary",
      edit: true,
      settingsOperation: operation,
    };
    await expect(
      service.assertChatAccess({ ...props, subjectId: "member" }),
    ).rejects.toThrow("owner");
    await expect(
      service.assertChatAccess({ ...props, subjectId: "creator" }),
    ).resolves.toBeUndefined();
  }
  await expect(
    service.assertChatAccess({
      subjectId: "member",
      chatId: "ordinary",
      edit: false,
    }),
  ).resolves.toBeUndefined();
});

it("requires a recorded owner even for staff already admitted to employee training", async () => {
  const { service, owners } = fixture();
  const props = {
    subjectId: "viewer",
    chatId: trainingChat.id,
    edit: true,
    settingsOperation: "update-chat",
  };
  await expect(service.assertChatAccess(props)).rejects.toThrow("owner");
  owners.add("viewer:" + trainingChat.id);
  await expect(service.assertChatAccess(props)).resolves.toBeUndefined();
  await expect(
    service.assertChatAccess({ ...props, settingsOperation: "members" }),
  ).rejects.toThrow("employee and trainer");
});
