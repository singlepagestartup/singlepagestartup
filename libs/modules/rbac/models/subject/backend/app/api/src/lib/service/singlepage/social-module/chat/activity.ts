import type { Service as SubjectService } from "../../index";

export interface IChatActivity {
  lastMessageAt: string | null;
  unreadCount: number;
}

const emptyActivity: IChatActivity = { lastMessageAt: null, unreadCount: 0 };

export class Service {
  constructor(readonly subject: Pick<SubjectService, "repository">) {}

  async forChats<T extends { id: string }>(subjectId: string, chats: T[]) {
    const activity = await this.subject.repository.socialThreadActivity({
      subjectId,
      chatIds: chats.map(({ id }) => id),
    });
    const activityByChat = new Map<string, IChatActivity>();
    for (const { chatId, lastMessageAt, unreadCount } of activity) {
      const previous = activityByChat.get(chatId) ?? emptyActivity;
      activityByChat.set(chatId, {
        lastMessageAt:
          lastMessageAt > (previous.lastMessageAt ?? "")
            ? lastMessageAt
            : previous.lastMessageAt,
        unreadCount: previous.unreadCount + unreadCount,
      });
    }
    return chats.map((chat) => ({
      ...chat,
      ...(activityByChat.get(chat.id) ?? emptyActivity),
    }));
  }

  async forThreads<T extends { id: string }>(
    subjectId: string,
    chatId: string,
    threads: T[],
  ) {
    const activity = await this.subject.repository.socialThreadActivity({
      subjectId,
      chatIds: [chatId],
      threadIds: threads.map(({ id }) => id),
    });
    const activityByThread = new Map(
      activity.map((row) => [row.threadId, row]),
    );
    return threads.map((thread) => {
      const row = activityByThread.get(thread.id) ?? emptyActivity;
      return {
        ...thread,
        lastMessageAt: row.lastMessageAt,
        unreadCount: row.unreadCount,
      };
    });
  }

  async markRead(input: {
    subjectId: string;
    chatId: string;
    threadId: string;
    messageId: string;
  }) {
    await this.subject.repository.advanceSocialThreadReadCursor(input);
    const activity = await this.subject.repository.socialThreadActivity({
      subjectId: input.subjectId,
      chatIds: [input.chatId],
    });
    return {
      threadId: input.threadId,
      unreadCount:
        activity.find((row) => row.threadId === input.threadId)?.unreadCount ??
        0,
      chatUnreadCount: activity.reduce(
        (count, row) => count + row.unreadCount,
        0,
      ),
    };
  }
}
