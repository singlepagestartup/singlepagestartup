"use client";
import { Component as ChatsToThreads } from "../../../../relations/chats-to-threads/index";
import { Component as SocialModuleThread } from "../../../thread/index";
import { ProductsThreadProvider } from "../../../thread/singlepage/ai-chat-products/Thread";
import type { ReactNode } from "react";

export interface IProductsChatProps {
  profileId: string;
  navigation?: ReactNode;
}
export function Component({ profileId, navigation }: IProductsChatProps) {
  const chatId = `${profileId}:project-chat`;
  const threadId = `${profileId}:thread:document:products`;
  return (
    <section
      data-ds-block="social.chat.ai-chat-products"
      data-module="social"
      data-model="chat"
      data-id={chatId}
      data-chat-id={chatId}
      data-variant="ai-chat-products"
      className="@container/chat flex min-h-0 min-w-0 flex-1 flex-col"
      aria-label="Active chat"
    >
      <ChatsToThreads
        variant="find"
        data={[
          {
            id: `${chatId}:${threadId}`,
            chatId,
            threadId: threadId,
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
          links.some((link) => link.threadId === threadId) ? (
            <ProductsThreadProvider profileId={profileId}>
              <SocialModuleThread
                variant="ai-chat-products"
                navigation={navigation}
              />
            </ProductsThreadProvider>
          ) : (
            <p role="status">Thread unavailable.</p>
          )
        }
      </ChatsToThreads>
    </section>
  );
}
