import type { ReactNode } from "react";
import type { IAIChatChat } from "../../../../../../workspace/utils/products/ai-chat-models";
import type {
  IAIChatThread,
  IChatThreadRelation,
} from "../../../../../../workspace/utils/products/ai-chat-threads";
import { Component as ChatThreads } from "../../../../relations/chats-to-threads/singlepage/ai-chat-find/index";
export interface IChatWorkspaceProps {
  data: IAIChatChat;
  threads: IAIChatThread[];
  relations: IChatThreadRelation[];
  selectedThreadId?: string;
  children: (thread: IAIChatThread | undefined) => ReactNode;
}
export function Component({
  data,
  threads,
  relations,
  selectedThreadId,
  children,
}: IChatWorkspaceProps) {
  return (
    <section
      data-ds-block="social.chat.ai-chat-workspace"
      data-module="social"
      data-model="chat"
      data-id={data.id}
      data-chat-id={data.id}
      data-variant="ai-chat-workspace"
      className="@container/chat flex min-h-0 min-w-0 flex-col"
      aria-label="Active chat"
    >
      <ChatThreads
        variant="find"
        data={relations}
        apiProps={{
          params: {
            filters: {
              and: [{ column: "chatId", method: "eq", value: data.id }],
            },
          },
        }}
      >
        {(links) => {
          const thread = threads.find(
            (record) =>
              record.id === selectedThreadId &&
              links.some((link) => link.threadId === record.id),
          );
          return selectedThreadId && !thread ? (
            <p role="status" className="p-4">
              Thread unavailable.
            </p>
          ) : (
            children(thread)
          );
        }}
      </ChatThreads>
    </section>
  );
}
