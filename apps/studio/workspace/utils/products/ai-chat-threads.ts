import type { IProjectProfile, IProjectMessage } from "./ai-chat-workspace";
import type {
  IAIChatChat,
  IAIChatSource,
  IProfileChatRelation,
} from "./ai-chat-models";

export interface IAIChatThread {
  id: string;
  slug: string;
  title: string;
  variant: "ai-chat-workspace";
}
export interface IChatThreadRelation {
  id: string;
  chatId: string;
  threadId: string;
  orderIndex: number;
}
export interface IThreadMessageRelation {
  id: string;
  threadId: string;
  messageId: string;
  orderIndex: number;
}
// Local display selection; these are not fields added to Social Thread.
export interface IThreadSelection {
  threadId: string;
  kind: "document" | "work";
  localId: string;
}
export interface IProjectThreadGraph {
  chat: IAIChatChat;
  profileChats: IProfileChatRelation[];
  threads: IAIChatThread[];
  chatThreads: IChatThreadRelation[];
  messages: IProjectMessage[];
  threadMessages: IThreadMessageRelation[];
  selections: IThreadSelection[];
}

export function projectThreadGraph(
  project: IProjectProfile,
): IProjectThreadGraph {
  const chat = {
    id: `${project.id}:project-chat`,
    title: project.name,
    variant: "ai-chat-project" as const,
  };
  const threads: IAIChatThread[] = [];
  const chatThreads: IChatThreadRelation[] = [];
  const threadMessages: IThreadMessageRelation[] = [];
  const messages = new Map<string, IProjectMessage>();
  const selections: IThreadSelection[] = [];
  const append = (
    kind: IThreadSelection["kind"],
    localId: string,
    title: string,
    records: IProjectMessage[],
  ) => {
    const threadId = `${project.id}:thread:${kind}:${localId}`;
    threads.push({
      id: threadId,
      slug: `${encodeURIComponent(project.id)}:${kind}:${encodeURIComponent(localId)}`,
      title,
      variant: "ai-chat-workspace",
    });
    selections.push({ threadId, kind, localId });
    chatThreads.push({
      id: `${chat.id}:${threadId}`,
      chatId: chat.id,
      threadId,
      orderIndex: chatThreads.length,
    });
    records.forEach((message, orderIndex) => {
      messages.set(message.id, message);
      threadMessages.push({
        id: `${threadId}:${message.id}`,
        threadId,
        messageId: message.id,
        orderIndex,
      });
    });
  };
  project.documents.forEach((document) =>
    append("document", document.id, `${document.title}.md`, document.messages),
  );
  project.topics.forEach((topic) =>
    append("work", topic.id, topic.title, topic.messages),
  );
  return {
    chat,
    profileChats: [
      { id: `${chat.id}:project`, profileId: project.id, chatId: chat.id },
    ],
    threads,
    chatThreads,
    threadMessages,
    messages: [...messages.values()],
    selections,
  };
}

export function threadSources(
  sources: IAIChatSource[],
  slugs: string[],
): IAIChatSource[] {
  const records = new Map(sources.map((source) => [source.slug, source]));
  return [...new Set(slugs)].flatMap((slug) =>
    records.has(slug) ? [records.get(slug)!] : [],
  );
}

export function orderedThreadMessages(
  messages: IProjectMessage[],
  relations: IThreadMessageRelation[],
): IProjectMessage[] {
  const records = new Map(messages.map((message) => [message.id, message]));
  const seen = new Set<string>();
  return [...relations]
    .sort((a, b) => a.orderIndex - b.orderIndex || a.id.localeCompare(b.id))
    .flatMap((relation) => {
      const message = records.get(relation.messageId);
      if (!message || seen.has(message.id)) return [];
      seen.add(message.id);
      return [message];
    });
}
