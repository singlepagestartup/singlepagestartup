"use client";
import { Component as SocialModuleThread } from "../../../thread/index";
import { ProductsThreadProvider } from "../../../thread/singlepage/ai-chat-products/Thread";
import type { ReactNode } from "react";

export interface IProductsChatProps {
  profileId: string;
  navigation?: ReactNode;
}
export function Component({ profileId, navigation }: IProductsChatProps) {
  const chatId = `${profileId}:project-chat`;
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
      <ProductsThreadProvider profileId={profileId}>
        <SocialModuleThread
          variant="ai-chat-products"
          navigation={navigation}
        />
      </ProductsThreadProvider>
    </section>
  );
}
