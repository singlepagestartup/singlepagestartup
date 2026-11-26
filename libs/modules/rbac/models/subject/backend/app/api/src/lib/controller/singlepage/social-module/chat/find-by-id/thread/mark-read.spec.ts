import { Handler } from "./mark-read";

function request(messageId: string) {
  return {
    req: {
      param: (key: string) =>
        ({
          id: "reader",
          socialModuleChatId: "chat",
          socialModuleThreadId: "thread",
        })[key],
      parseBody: async () => ({ data: JSON.stringify({ messageId }) }),
    },
    header: jest.fn(),
    json: jest.fn((data) => data),
  } as any;
}

it("rejects malformed markers before querying the database", async () => {
  const advanceSocialThreadReadCursor = jest.fn();
  const handler = new Handler({
    repository: { advanceSocialThreadReadCursor },
  } as never);
  await expect(handler.execute(request("invalid"))).rejects.toThrow(
    "valid message ID",
  );
  expect(advanceSocialThreadReadCursor).not.toHaveBeenCalled();
});

it("marks the requested thread for the owner resolved by the route", async () => {
  const marker = "d90885ce-d1c3-4049-9130-ce93b1a88797";
  const repository = {
    advanceSocialThreadReadCursor: jest.fn().mockResolvedValue(undefined),
    socialThreadActivity: jest.fn().mockResolvedValue([]),
  };
  const handler = new Handler({ repository } as never);

  await expect(handler.execute(request(marker))).resolves.toEqual({
    data: { threadId: "thread", unreadCount: 0, chatUnreadCount: 0 },
  });
  expect(repository.advanceSocialThreadReadCursor).toHaveBeenCalledWith({
    subjectId: "reader",
    chatId: "chat",
    threadId: "thread",
    messageId: marker,
  });
});
