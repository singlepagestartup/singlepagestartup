import { Service } from "./index";

const chats = [
  { id: "ordinary", variant: "default" },
  { id: "own-order", variant: "customer-work" },
  { id: "other-order", variant: "default" },
  { id: "orphan", variant: "customer-work" },
  { id: "ambiguous", variant: "customer-work" },
];
function fixture() {
  const social = {
    chat: {
      findById: jest.fn(async ({ id }) => chats.find((chat) => chat.id === id)),
    },
    chatsToThreads: {
      find: jest.fn(async () => [
        { chatId: "own-order", threadId: "first" },
        { chatId: "other-order", threadId: "second" },
        { chatId: "ambiguous", threadId: "third" },
        { chatId: "ambiguous", threadId: "fourth" },
      ]),
    },
    threadsToCrmModuleTasks: {
      find: jest.fn(async () => [
        { threadId: "first", crmModuleTaskId: "mine" },
        { threadId: "second", crmModuleTaskId: "theirs" },
        { threadId: "third", crmModuleTaskId: "also-mine" },
      ]),
    },
  };
  const find = jest.fn(async () => [
    { id: "mine", customerId: "viewer" },
    { id: "also-mine", customerId: "viewer" },
  ]);
  const service = new Service({
    modules: { social, crm: { task: { find } } },
  } as unknown as ConstructorParameters<typeof Service>[0]);
  return { service, find };
}
it("recognizes the customer's order and ordinary chats while excluding foreign, incomplete and ambiguous orders", async () => {
  const { service, find } = fixture();
  expect([...(await service.chatAccess("viewer", chats)).keys()]).toEqual([
    "ordinary",
    "own-order",
  ]);
  expect(find).toHaveBeenCalledTimes(1);
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
