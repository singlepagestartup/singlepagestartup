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
  const social = {
    chat: {
      findById: jest.fn(async ({ id }) =>
        [...chats, trainingChat].find((chat) => chat.id === id),
      ),
    },
    chatsToThreads: {
      find: jest.fn(async () => [
        { chatId: "own-order", threadId: "first" },
        { chatId: "multi-thread", threadId: "fifth" },
        { chatId: "multi-thread", threadId: "sixth" },
        { chatId: "other-order", threadId: "second" },
        { chatId: "ambiguous", threadId: "third" },
        { chatId: "ambiguous", threadId: "fourth" },
      ]),
    },
    threadsToCrmModuleTasks: {
      find: jest.fn(async ({ params }) => {
        const filter = params.filters.and[0];
        const links = [
          { threadId: "first", crmModuleTaskId: "mine" },
          { threadId: "second", crmModuleTaskId: "theirs" },
          { threadId: "third", crmModuleTaskId: "also-mine" },
          { threadId: "fifth", crmModuleTaskId: "consultation" },
        ];
        return links.filter(({ threadId }) =>
          filter.method === "eq"
            ? filter.value === threadId
            : filter.value.includes(threadId),
        );
      }),
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
  const service = new Service({
    modules: { social, crm: { task: { find } } },
    crmWorkspace: { employees: { scopeForChat } },
  } as unknown as ConstructorParameters<typeof Service>[0]);
  return { service, find };
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
