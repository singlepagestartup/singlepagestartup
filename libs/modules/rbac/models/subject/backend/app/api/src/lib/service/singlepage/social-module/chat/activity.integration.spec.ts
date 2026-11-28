import { randomUUID } from "node:crypto";
import { Hono } from "hono";
import { withConsistencyDatabase } from "@sps/shared-backend-api";
import {
  getDrizzle,
  getPostgresClient,
  resetPostgresClient,
} from "@sps/shared-backend-database-config";
import { DATABASE_OPTIONS } from "@sps/shared-utils";
import { Table as Funnel } from "@sps/crm/models/funnel/backend/repository/database";
import { Table as Task } from "@sps/crm/models/task/backend/repository/database";
import { Table as FunnelTask } from "@sps/crm/relations/funnels-to-tasks/backend/repository/database";
import { Table as TaskOrder } from "@sps/crm/relations/tasks-to-ecommerce-module-orders/backend/repository/database";
import { Table as Order } from "@sps/ecommerce/models/order/backend/repository/database";
import { Table as Store } from "@sps/ecommerce/models/store/backend/repository/database";
import { Table as Subject } from "@sps/rbac/models/subject/backend/repository/database";
import { Table as SubjectTask } from "@sps/rbac/relations/subjects-to-crm-module-tasks/backend/repository/database";
import { Table as StoreGrant } from "@sps/rbac/relations/subjects-to-ecommerce-module-stores/backend/repository/database";
import { Table as SubjectProfile } from "@sps/rbac/relations/subjects-to-social-module-profiles/backend/repository/database";
import { Table as Chat } from "@sps/social/models/chat/backend/repository/database";
import { Table as ChatTask } from "@sps/social/relations/chats-to-crm-module-tasks/backend/repository/database";
import { Table as Message } from "@sps/social/models/message/backend/repository/database";
import { Table as Profile } from "@sps/social/models/profile/backend/repository/database";
import { Table as Thread } from "@sps/social/models/thread/backend/repository/database";
import { Table as ChatMessage } from "@sps/social/relations/chats-to-messages/backend/repository/database";
import { Table as ChatThread } from "@sps/social/relations/chats-to-threads/backend/repository/database";
import { ORDER_SUPPORT_THREAD_VARIANT } from "@sps/social/relations/chats-to-threads/sdk/model";
import { Table as ProfileChat } from "@sps/social/relations/profiles-to-chats/backend/repository/database";
import { Table as ProfileMessage } from "@sps/social/relations/profiles-to-messages/backend/repository/database";
import { Table as ThreadMessage } from "@sps/social/relations/threads-to-messages/backend/repository/database";
import { Configuration } from "../../../../configuration";
import { Handler as MarkReadHandler } from "../../../../controller/singlepage/social-module/chat/find-by-id/thread/mark-read";
import { Repository } from "../../../../repository";
import { Service } from "./activity";

let postgres: ReturnType<typeof getPostgresClient> | undefined;

afterAll(async () => {
  if (postgres) {
    await postgres.end();
    resetPostgresClient();
  }
});

it("excludes private order support from employee unread counts and cursor updates", async () => {
  expect(["localhost", "127.0.0.1", "::1"]).toContain(DATABASE_OPTIONS.host);
  postgres = getPostgresClient();
  const db = getDrizzle({});
  const repository = new Repository(new Configuration());
  const activity = new Service({ repository });
  const handler = new MarkReadHandler({ repository } as ConstructorParameters<
    typeof MarkReadHandler
  >[0]);
  const route = new Hono().post(
    "/subjects/:id/chats/:socialModuleChatId/threads/:socialModuleThreadId/read",
    (context) => handler.execute(context),
  );
  const rollback = new Error("Rollback order support unread fixtures");
  const prefix = `support-unread-${randomUUID()}`;
  const unreadSince = new Date("2026-01-01T12:00:00.000Z");
  const earlier = new Date("2026-01-01T12:01:00.000Z");
  const later = new Date("2026-01-01T12:02:00.000Z");

  await expect(
    db.transaction((tx) =>
      withConsistencyDatabase(tx, async () => {
        const [buyer, owner, employee] = await tx
          .insert(Subject)
          .values(
            ["buyer", "owner", "employee"].map((label) => ({
              slug: `${prefix}-${label}`,
              socialThreadReadsSince: unreadSince,
            })),
          )
          .returning();
        const [buyerProfile, ownerProfile, employeeProfile] = await tx
          .insert(Profile)
          .values(
            ["buyer", "owner", "employee"].map((label) => ({
              slug: `${prefix}-${label}-profile`,
            })),
          )
          .returning();
        const people = [
          { subjectId: buyer.id, profileId: buyerProfile.id },
          { subjectId: owner.id, profileId: ownerProfile.id },
          { subjectId: employee.id, profileId: employeeProfile.id },
        ];
        const [chat] = await tx
          .insert(Chat)
          .values({ slug: `${prefix}-chat`, variant: "customer-work" })
          .returning();
        await tx.insert(SubjectProfile).values(
          people.map(({ subjectId, profileId }) => ({
            subjectId,
            socialModuleProfileId: profileId,
          })),
        );
        await tx
          .insert(ProfileChat)
          .values(
            people.map(({ profileId }) => ({ chatId: chat.id, profileId })),
          );

        const [store, relatedStore] = await tx
          .insert(Store)
          .values([
            { slug: `${prefix}-store` },
            { slug: `${prefix}-related-store` },
          ])
          .returning();
        await tx.insert(StoreGrant).values([
          {
            ecommerceModuleStoreId: store.id,
            subjectId: owner.id,
            variant: "owner",
          },
          {
            ecommerceModuleStoreId: store.id,
            subjectId: employee.id,
            variant: "crm-worker",
          },
          {
            ecommerceModuleStoreId: relatedStore.id,
            subjectId: employee.id,
            variant: "owner",
          },
        ]);
        const [primary, related] = await tx
          .insert(Funnel)
          .values(
            [store, relatedStore].map(({ id }) => ({
              storeId: id,
              name: prefix,
              slug: prefix,
              kind: "individual-service" as const,
              definition: { initialStageId: "final" },
              bindings: { formIds: [] },
            })),
          )
          .returning();
        const [task] = await tx
          .insert(Task)
          .values({
            stageId: "final",
            status: "closed",
            outcome: "completed",
            openingKey: prefix,
            openingDigest: prefix,
          })
          .returning();
        await tx.insert(FunnelTask).values([
          { taskId: task.id, funnelId: primary.id },
          { taskId: task.id, funnelId: related.id, variant: "related" },
        ]);
        await tx.insert(SubjectTask).values({
          subjectId: buyer.id,
          crmModuleTaskId: task.id,
          variant: "customer",
        });
        const [order] = await tx
          .insert(Order)
          .values({ type: "history", status: "completed" })
          .returning();
        await tx
          .insert(TaskOrder)
          .values({ taskId: task.id, orderId: order.id });
        await tx
          .insert(ChatTask)
          .values({ chatId: chat.id, crmModuleTaskId: task.id });
        const [discussion, support] = await tx
          .insert(Thread)
          .values([
            { slug: `${prefix}-work` },
            {
              slug: `${prefix}-support`,
              metadata: { orderSupportTaskId: task.id },
            },
          ])
          .returning();
        await tx.insert(ChatThread).values([
          { chatId: chat.id, threadId: discussion.id },
          {
            chatId: chat.id,
            threadId: support.id,
            variant: ORDER_SUPPORT_THREAD_VARIANT,
          },
        ]);
        const [workMessage, supportMessage] = await tx
          .insert(Message)
          .values([
            { createdAt: earlier, description: "Order history" },
            { createdAt: later, description: "Private support" },
          ])
          .returning();
        await tx.insert(ChatMessage).values(
          [workMessage, supportMessage].map(({ id }) => ({
            chatId: chat.id,
            messageId: id,
          })),
        );
        await tx.insert(ThreadMessage).values([
          { threadId: discussion.id, messageId: workMessage.id },
          { threadId: support.id, messageId: supportMessage.id },
        ]);
        await tx.insert(ProfileMessage).values([
          { profileId: buyerProfile.id, messageId: workMessage.id },
          { profileId: ownerProfile.id, messageId: supportMessage.id },
        ]);

        await expect(
          activity.forChats(employee.id, [chat]),
        ).resolves.toMatchObject([
          { unreadCount: 1, lastMessageAt: earlier.toISOString() },
        ]);
        await expect(
          repository.socialThreadActivity({
            subjectId: employee.id,
            chatIds: [chat.id],
            threadIds: [support.id],
          }),
        ).resolves.toEqual([]);
        const supportMarker = {
          chatId: chat.id,
          threadId: support.id,
          messageId: supportMessage.id,
        };
        await expect(
          activity.markRead({ subjectId: employee.id, ...supportMarker }),
        ).rejects.toThrow("message is unavailable");
        const markerPath = (subjectId: string, threadId: string) =>
          `/subjects/${subjectId}/chats/${chat.id}/threads/${threadId}/read`;
        const markRead = (
          subjectId: string,
          threadId: string,
          messageId: string,
        ) => {
          const form = new FormData();
          form.set("data", JSON.stringify({ messageId }));
          return route.request(markerPath(subjectId, threadId), {
            method: "POST",
            body: form,
          });
        };
        const invalid = await route.request(
          markerPath(employee.id, discussion.id),
          {
            method: "POST",
            headers: {
              "content-type": "multipart/form-data; boundary=incomplete",
            },
            body: '--incomplete\r\nContent-Disposition: form-data; name="data"\r\n\r\n{',
          },
        );
        expect(invalid.status).toBe(400);
        await expect(
          activity.forChats(employee.id, [chat]),
        ).resolves.toMatchObject([{ unreadCount: 1 }]);
        const readDiscussion = await markRead(
          employee.id,
          discussion.id,
          workMessage.id,
        );
        expect(readDiscussion.status).toBe(200);
        await expect(readDiscussion.json()).resolves.toMatchObject({
          data: { chatUnreadCount: 0 },
        });
        await expect(
          activity.forChats(buyer.id, [chat]),
        ).resolves.toMatchObject([
          { unreadCount: 1, lastMessageAt: later.toISOString() },
        ]);
        await expect(
          activity.forChats(owner.id, [chat]),
        ).resolves.toMatchObject([
          { unreadCount: 1, lastMessageAt: later.toISOString() },
        ]);
        const readSupport = await markRead(
          buyer.id,
          support.id,
          supportMessage.id,
        );
        expect(readSupport.status).toBe(200);
        await expect(readSupport.json()).resolves.toMatchObject({
          data: { unreadCount: 0, chatUnreadCount: 0 },
        });
        await expect(
          activity.markRead({ subjectId: owner.id, ...supportMarker }),
        ).resolves.toMatchObject({ unreadCount: 0, chatUnreadCount: 1 });
        throw rollback;
      }),
    ),
  ).rejects.toBe(rollback);
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
            .values({ createdAt, description: `Message\n**${minute}**` })
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
            lastMessagePreview: "Message 3",
            lastMessageAuthorId: otherProfile.id,
            lastMessageHasFiles: false,
          }),
          expect.objectContaining({
            id: unrelated.id,
            unreadCount: 1,
            lastMessagePreview: "Message 4",
          }),
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
