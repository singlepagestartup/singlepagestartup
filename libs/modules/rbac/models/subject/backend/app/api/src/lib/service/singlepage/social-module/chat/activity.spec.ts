import { Service } from "./activity";
import {
  insertSchema,
  selectSchema,
} from "@sps/rbac/models/subject/backend/repository/database";
import { signJwt } from "@sps/backend-utils";
import { decode } from "hono/jwt";

const rows = [
  {
    chatId: "chat",
    threadId: "first",
    lastMessageAt: "2026-11-21T12:03:40.000Z",
    unreadCount: 2,
  },
  {
    chatId: "chat",
    threadId: "second",
    lastMessageAt: "2026-11-21T12:04:40.000Z",
    unreadCount: 3,
  },
];

function setup() {
  const repository = {
    advanceSocialThreadReadCursor: jest.fn().mockResolvedValue(undefined),
    socialThreadActivity: jest.fn().mockResolvedValue(rows),
  };
  return { repository, service: new Service({ repository } as never) };
}

it("projects the latest message time and total unread from the visible chat's threads", async () => {
  const { repository, service } = setup();

  expect(
    await service.forChats("reader", [{ id: "chat" }, { id: "empty" }]),
  ).toEqual([
    { id: "chat", lastMessageAt: rows[1].lastMessageAt, unreadCount: 5 },
    { id: "empty", lastMessageAt: null, unreadCount: 0 },
  ]);
  expect(repository.socialThreadActivity).toHaveBeenCalledWith({
    subjectId: "reader",
    chatIds: ["chat", "empty"],
  });
});

it("passes the actual visible marker to persistence and returns thread and chat totals", async () => {
  const { repository, service } = setup();
  const scope = {
    subjectId: "reader",
    chatId: "chat",
    threadId: "first",
    messageId: "visible",
  };

  expect(await service.markRead(scope)).toEqual({
    threadId: "first",
    unreadCount: 2,
    chatUnreadCount: 5,
  });
  expect(repository.advanceSocialThreadReadCursor).toHaveBeenCalledWith(scope);
  expect(repository.socialThreadActivity).toHaveBeenCalledWith({
    subjectId: "reader",
    chatIds: ["chat"],
  });
});

it("keeps read state out of ordinary Subject reads, writes and JWT claims", async () => {
  const untrusted = {
    id: "d90885ce-d1c3-4049-9130-ce93b1a88797",
    slug: "reader",
    variant: "default",
    createdAt: new Date(),
    updatedAt: new Date(),
    tokensValidAfter: null,
    socialThreadReadsSince: new Date(),
    socialThreadReadCursors: {
      "chat/thread": { messageId: "marker", createdAt: "time" },
    },
  };

  for (const result of [
    selectSchema.parse(untrusted),
    insertSchema.parse(untrusted),
    insertSchema.partial().parse(untrusted),
  ]) {
    expect(result).not.toHaveProperty("socialThreadReadsSince");
    expect(result).not.toHaveProperty("socialThreadReadCursors");
  }
  const token = await signJwt(
    { subjectId: untrusted.id, type: "access", lifetimeInSeconds: 300 },
    "test-signing-secret",
  );
  expect(decode(token).payload.subject).toEqual({ id: untrusted.id });
});
