import type { ReactNode } from "react";
import { Component as ChatThreads } from "../../../../relations/chats-to-threads/singlepage/ai-chat-find/index";
import { Component as ThreadWorkspace } from "../../../thread/singlepage/ai-chat-workspace/index";
export interface IChatWorkspaceProps {
  profileId: string;
  navigation?: ReactNode;
}
export function Component({ profileId, navigation }: IChatWorkspaceProps) {
  const chatId = `${profileId}:project-chat`;
  const thread = {
    id: `${profileId}:thread:document:products`,
    slug: `${encodeURIComponent(profileId)}:document:products`,
    title: "Products.md",
    variant: "ai-chat-workspace" as const,
  };
  return (
    <section
      data-ds-block="social.chat.ai-chat-workspace"
      data-module="social"
      data-model="chat"
      data-id={chatId}
      data-chat-id={chatId}
      data-variant="ai-chat-workspace"
      className="@container/chat flex min-h-0 min-w-0 flex-1 flex-col"
      aria-label="Active chat"
    >
      <ChatThreads
        variant="find"
        data={[
          {
            id: `${chatId}:${thread.id}`,
            chatId,
            threadId: thread.id,
            orderIndex: 0,
          },
        ]}
        apiProps={{
          params: {
            filters: {
              and: [{ column: "chatId", method: "eq", value: chatId }],
            },
          },
        }}
      >
        {(links) =>
          links.some((link) => link.threadId === thread.id) ? (
            <ThreadWorkspace data={thread} navigation={navigation} />
          ) : (
            <p role="status">Thread unavailable.</p>
          )
        }
      </ChatThreads>
    </section>
  );
}
