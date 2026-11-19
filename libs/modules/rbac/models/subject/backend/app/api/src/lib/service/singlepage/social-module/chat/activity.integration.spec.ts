import { randomUUID } from "node:crypto";
import { withConsistencyDatabase } from "@sps/shared-backend-api";
import {
  getDrizzle,
  getPostgresClient,
  resetPostgresClient,
} from "@sps/shared-backend-database-config";
import { DATABASE_OPTIONS } from "@sps/shared-utils";
import { Table as Subject } from "@sps/rbac/models/subject/backend/repository/database";
import { Table as SubjectProfile } from "@sps/rbac/relations/subjects-to-social-module-profiles/backend/repository/database";
import { Table as Chat } from "@sps/social/models/chat/backend/repository/database";
import { Table as Message } from "@sps/social/models/message/backend/repository/database";
import { Table as Profile } from "@sps/social/models/profile/backend/repository/database";
import { Table as Thread } from "@sps/social/models/thread/backend/repository/database";
import { Table as ChatMessage } from "@sps/social/relations/chats-to-messages/backend/repository/database";
import { Table as ChatThread } from "@sps/social/relations/chats-to-threads/backend/repository/database";
import { Table as ProfileChat } from "@sps/social/relations/profiles-to-chats/backend/repository/database";
import { Table as ProfileMessage } from "@sps/social/relations/profiles-to-messages/backend/repository/database";
import { Table as ThreadMessage } from "@sps/social/relations/threads-to-messages/backend/repository/database";
import { Configuration } from "../../../../configuration";
import { Repository } from "../../../../repository";
import { Service } from "./activity";

let postgres: ReturnType<typeof getPostgresClient> | undefined;

afterAll(async () => {
  if (postgres) {
    await postgres.end();
    resetPostgresClient();
  }
});

it("counts incoming messages using independent monotonic read cursors", async () => {
  expect(["localhost", "127.0.0.1", "::1"]).toContain(DATABASE_OPTIONS.host);
  postgres = getPostgresClient();
  const db = getDrizzle({});
  const activity = new Service({
    repository: new Repository(new Configuration()),
  });
  const rollback = new Error("Rollback Social unread fixtures");
  const prefix = `unread-${randomUUID()}`;
  const start = new Date("2026-01-01T12:00:00.000Z");

  await expect(
    db.transaction((tx) =>
      withConsistencyDatabase(tx, async () => {
        const [reader, other] = await tx
          .insert(Subject)
          .values([
            { slug: `${prefix}-reader`, socialThreadReadsSince: start },
            { slug: `${prefix}-other`, socialThreadReadsSince: start },
          ])
          .returning();
        const [readerProfile, otherProfile] = await tx
          .insert(Profile)
          .values([
            { slug: `${prefix}-reader-profile` },
            { slug: `${prefix}-other-profile` },
          ])
          .returning();
        await tx.insert(SubjectProfile).values([
          { subjectId: reader.id, socialModuleProfileId: readerProfile.id },
          { subjectId: other.id, socialModuleProfileId: otherProfile.id },
        ]);
        const [chat] = await tx
          .insert(Chat)
          .values({ slug: `${prefix}-chat` })
          .returning();
        await tx.insert(ProfileChat).values([
          { chatId: chat.id, profileId: readerProfile.id },
          { chatId: chat.id, profileId: otherProfile.id },
        ]);
        const [thread, unrelated] = await tx
          .insert(Thread)
          .values([
            { slug: `${prefix}-thread` },
            { slug: `${prefix}-unrelated`, variant: "custom" },
          ])
          .returning();
        await tx.insert(ChatThread).values([
          { chatId: chat.id, threadId: thread.id },
          { chatId: chat.id, threadId: unrelated.id, variant: "custom" },
        ]);

        async function sendMessage(
          threadId: string,
          profileId: string,
          minute: number,
        ) {
          const createdAt = new Date(start.getTime() + minute * 60_000);
          const [message] = await tx
            .insert(Message)
            .values({ createdAt })
            .returning();
          await tx
            .insert(ChatMessage)
            .values({ chatId: chat.id, messageId: message.id });
          await tx
            .insert(ThreadMessage)
            .values({ threadId, messageId: message.id });
          await tx
            .insert(ProfileMessage)
            .values({ profileId, messageId: message.id });
          return message;
        }

        const first = await sendMessage(thread.id, otherProfile.id, 1);
        await sendMessage(thread.id, readerProfile.id, 2);
        const second = await sendMessage(thread.id, otherProfile.id, 3);
        const unrelatedMessage = await sendMessage(
          unrelated.id,
          otherProfile.id,
          4,
        );
        const markRead = (messageId: string) =>
          activity.markRead({
            subjectId: reader.id,
            chatId: chat.id,
            threadId: thread.id,
            messageId,
          });

        await expect(
          activity.forThreads(reader.id, chat.id, [thread, unrelated]),
        ).resolves.toEqual([
          expect.objectContaining({
            id: thread.id,
            unreadCount: 2,
            lastMessageAt: second.createdAt.toISOString(),
          }),
          expect.objectContaining({ id: unrelated.id, unreadCount: 1 }),
        ]);
        await expect(activity.forChats(reader.id, [chat])).resolves.toEqual([
          expect.objectContaining({
            id: chat.id,
            unreadCount: 3,
            lastMessageAt: unrelatedMessage.createdAt.toISOString(),
          }),
        ]);
        await expect(markRead(first.id)).resolves.toEqual({
          threadId: thread.id,
          unreadCount: 1,
          chatUnreadCount: 2,
        });
        await expect(markRead(first.id)).resolves.toEqual({
          threadId: thread.id,
          unreadCount: 1,
          chatUnreadCount: 2,
        });

        const newest = await sendMessage(thread.id, otherProfile.id, 5);
        await expect(
          activity.forThreads(reader.id, chat.id, [thread]),
        ).resolves.toEqual([
          expect.objectContaining({
            id: thread.id,
            unreadCount: 2,
            lastMessageAt: newest.createdAt.toISOString(),
          }),
        ]);
        await expect(markRead(second.id)).resolves.toEqual({
          threadId: thread.id,
          unreadCount: 1,
          chatUnreadCount: 2,
        });
        await expect(markRead(first.id)).resolves.toEqual({
          threadId: thread.id,
          unreadCount: 1,
          chatUnreadCount: 2,
        });
        await expect(markRead(unrelatedMessage.id)).rejects.toThrow(
          "message is unavailable in this thread",
        );
        await expect(
          activity.forThreads(other.id, chat.id, [thread]),
        ).resolves.toEqual([
          expect.objectContaining({ id: thread.id, unreadCount: 1 }),
        ]);
        await expect(
          activity.forThreads(reader.id, chat.id, [unrelated]),
        ).resolves.toEqual([
          expect.objectContaining({ id: unrelated.id, unreadCount: 1 }),
        ]);

        throw rollback;
      }),
    ),
  ).rejects.toBe(rollback);
});
