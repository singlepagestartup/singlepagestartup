import "reflect-metadata";
import { injectFromBase, injectable } from "inversify";
import {
  DatabaseRepository,
  consistencyContext,
  trackRepositoryRead,
  withConsistencyDatabase,
} from "@sps/shared-backend-api";
import { Table } from "@sps/rbac/models/subject/backend/repository/database";
import { Table as SubjectProfile } from "@sps/rbac/relations/subjects-to-social-module-profiles/backend/repository/database";
import { Table as Message } from "@sps/social/models/message/backend/repository/database";
import { Table as ChatThread } from "@sps/social/relations/chats-to-threads/backend/repository/database";
import { Table as ChatMessage } from "@sps/social/relations/chats-to-messages/backend/repository/database";
import { Table as ThreadMessage } from "@sps/social/relations/threads-to-messages/backend/repository/database";
import { Table as ProfileMessage } from "@sps/social/relations/profiles-to-messages/backend/repository/database";
import { and, eq, inArray, sql } from "drizzle-orm";

interface ISocialActivityScope {
  subjectId: string;
  chatIds: string[];
  threadIds?: string[];
}

interface ISocialReadScope {
  subjectId: string;
  chatId: string;
  threadId: string;
  messageId: string;
}

@injectable()
@injectFromBase()
export class Repository extends DatabaseRepository<typeof Table> {
  async socialThreadActivity({
    subjectId,
    chatIds,
    threadIds,
  }: ISocialActivityScope) {
    if (!chatIds.length || threadIds?.length === 0) {
      return [];
    }

    const chatFilter = {
      and: [{ column: "chatId", method: "inArray" as const, value: chatIds }],
    };
    await trackRepositoryRead(Table, this.db, {
      and: [{ column: "id", method: "eq", value: subjectId }],
    });
    await trackRepositoryRead(ChatThread, this.db, chatFilter);
    await trackRepositoryRead(ChatMessage, this.db, chatFilter);
    await trackRepositoryRead(
      ThreadMessage,
      this.db,
      threadIds
        ? { and: [{ column: "threadId", method: "inArray", value: threadIds }] }
        : undefined,
    );
    await trackRepositoryRead(Message, this.db);
    await trackRepositoryRead(ProfileMessage, this.db);
    await trackRepositoryRead(SubjectProfile, this.db, {
      and: [{ column: "subjectId", method: "eq", value: subjectId }],
    });

    const cursor = sql`${Table.socialThreadReadCursors} ->
      (${ChatThread.chatId}::text || '/' || ${ChatThread.threadId}::text)`;
    const incoming = sql`NOT EXISTS (
      SELECT 1 FROM ${ProfileMessage}
      JOIN ${SubjectProfile}
        ON ${SubjectProfile.socialModuleProfileId} = ${ProfileMessage.profileId}
      WHERE ${ProfileMessage.messageId} = ${Message.id}
        AND ${SubjectProfile.subjectId} = ${subjectId}
        AND ${SubjectProfile.variant} <> 'assistant'
    )`;
    return this.db
      .select({
        chatId: ChatThread.chatId,
        threadId: ChatThread.threadId,
        lastMessageAt: sql<string>`to_char(max(${Message.createdAt}), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')`,
        unreadCount: sql<number>`(count(*) FILTER (WHERE ${incoming}
          AND ${Message.createdAt} > ${Table.socialThreadReadsSince} AND (
          (${cursor} ->> 'createdAt') IS NULL OR
          (${Message.createdAt}, ${Message.id}) >
            ((${cursor} ->> 'createdAt')::timestamp, (${cursor} ->> 'messageId')::uuid)
        )))::integer`,
      })
      .from(ChatThread)
      .innerJoin(ThreadMessage, eq(ThreadMessage.threadId, ChatThread.threadId))
      .innerJoin(Message, eq(Message.id, ThreadMessage.messageId))
      .innerJoin(
        ChatMessage,
        and(
          eq(ChatMessage.chatId, ChatThread.chatId),
          eq(ChatMessage.messageId, Message.id),
        ),
      )
      .innerJoin(Table, eq(Table.id, subjectId))
      .where(
        and(
          inArray(ChatThread.chatId, chatIds),
          threadIds ? inArray(ChatThread.threadId, threadIds) : undefined,
        ),
      )
      .groupBy(ChatThread.chatId, ChatThread.threadId);
  }

  async advanceSocialThreadReadCursor({
    subjectId,
    chatId,
    threadId,
    messageId,
  }: ISocialReadScope) {
    const [marker] = await this.db
      .select({
        messageId: Message.id,
        createdAt: sql<string>`${Message.createdAt}::text`,
      })
      .from(Message)
      .innerJoin(
        ThreadMessage,
        and(
          eq(ThreadMessage.threadId, threadId),
          eq(ThreadMessage.messageId, Message.id),
        ),
      )
      .innerJoin(
        ChatMessage,
        and(
          eq(ChatMessage.chatId, chatId),
          eq(ChatMessage.messageId, Message.id),
        ),
      )
      .innerJoin(
        ChatThread,
        and(eq(ChatThread.chatId, chatId), eq(ChatThread.threadId, threadId)),
      )
      .where(eq(Message.id, messageId));
    if (!marker) {
      throw new Error(
        "Not Found error. The message is unavailable in this thread",
      );
    }

    const key = `${chatId}/${threadId}`;
    const cursor = sql`${Table.socialThreadReadCursors} -> ${key}`;
    await this.db
      .update(Table)
      .set({
        socialThreadReadCursors: sql`jsonb_set(
          ${Table.socialThreadReadCursors}, ARRAY[${key}]::text[],
          ${JSON.stringify(marker)}::jsonb
        )`,
      })
      .where(
        and(
          eq(Table.id, subjectId),
          sql`((${cursor} ->> 'createdAt') IS NULL OR
          ((${cursor} ->> 'createdAt')::timestamp, (${cursor} ->> 'messageId')::uuid)
            < (${marker.createdAt}::timestamp, ${marker.messageId}::uuid))`,
        ),
      );
  }

  withCatalogLock<T>(keys: string[], operation: () => Promise<T>): Promise<T> {
    return this.withScopedLocks("rbac.catalog", keys, operation);
  }

  withWalletLocks<T>(keys: string[], operation: () => Promise<T>): Promise<T> {
    return this.withScopedLocks("rbac.wallet", keys, operation);
  }

  private withScopedLocks<T>(
    namespace: string,
    keys: string[],
    operation: () => Promise<T>,
  ): Promise<T> {
    const run = async () => {
      for (const key of [...new Set(keys)].sort()) {
        await this.db.execute(
          sql`SELECT pg_advisory_xact_lock(hashtext(${`${namespace}:${key}`}))`,
        );
      }
      return operation();
    };
    if (consistencyContext.getStore()?.database) {
      return run();
    }
    return this.db.transaction((tx) => withConsistencyDatabase(tx, run));
  }

  withSubjectLock<T>(
    scope: { subjectId: string },
    operation: () => Promise<T>,
  ): Promise<T> {
    const run = async () => {
      await this.db.execute(
        sql`SELECT pg_advisory_xact_lock(hashtext(${`rbac.order-delivery.subject:${scope.subjectId}`}))`,
      );
      return operation();
    };
    if (consistencyContext.getStore()?.database) return run();
    return this.db.transaction((tx) => withConsistencyDatabase(tx, run));
  }

  async lockOrderDelivery(scope: { subjectId: string; orderId: string }) {
    if (!consistencyContext.getStore()?.database)
      throw new Error("Order delivery lock requires an owner transaction");
    await this.db.execute(
      sql`SELECT pg_advisory_xact_lock(hashtext(${`rbac.order-delivery.subject:${scope.subjectId}`}))`,
    );
    await this.db.execute(
      sql`SELECT pg_advisory_xact_lock(hashtext(${`rbac.order-delivery.order:${scope.orderId}`}))`,
    );
  }

  async lockCartGuest(subjectId: string) {
    if (!consistencyContext.getStore()?.database) {
      throw new Error("Guest cart lock requires a subject transaction");
    }
    // Identity links reference this row. Registration and logout must serialize
    // with the guest check and ownership changes in the same transaction.
    await trackRepositoryRead(Table, this.db, {
      and: [{ column: "id", method: "eq", value: subjectId }],
    });
    const [guest] = await this.db
      .select({
        variant: Table.variant,
        tokensValidAfter: Table.tokensValidAfter,
      })
      .from(Table)
      .where(eq(Table.id, subjectId))
      .for("update");
    return guest;
  }

  withOrderDelivery<T>(
    scope: { subjectId: string; orderId: string },
    operation: () => Promise<T>,
  ) {
    return this.withSubjectLock(scope, async () => {
      await this.lockOrderDelivery(scope);
      return operation();
    });
  }
}
