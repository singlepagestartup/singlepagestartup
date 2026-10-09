"use client";
import { Component as SocialModuleThread } from "../../../thread/index";
import type { ReactNode } from "react";

export interface IChatOverviewProps {
  chatId?: string;
  navigation?: ReactNode;
  messageCreate?: ReactNode;
}
export function Component({
  chatId = "project-chat",
  navigation,
  messageCreate,
}: IChatOverviewProps) {
  return (
    <section
      data-ds-block="social.chat.ai-chat-overview"
      data-module="social"
      data-model="chat"
      data-id={chatId}
      data-chat-id={chatId}
      data-variant="ai-chat-overview"
      className="@container/chat flex min-h-0 min-w-0 flex-1 flex-col"
      aria-label="Active chat"
    >
      <SocialModuleThread
        variant="ai-chat-overview"
        navigation={navigation}
        messageCreate={messageCreate}
      />
    </section>
  );
}
