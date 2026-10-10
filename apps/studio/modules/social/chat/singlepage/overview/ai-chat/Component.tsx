"use client";
import { Component as SocialModuleThread } from "../../../../thread/index";
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
      data-ds-block="social.chat.overview-ai-chat"
      data-module="social"
      data-model="chat"
      data-id={chatId}
      data-chat-id={chatId}
      data-variant="overview-ai-chat"
      className="@container/chat flex min-h-0 min-w-0 flex-1 flex-col"
      aria-label="Active chat"
    >
      <SocialModuleThread
        variant="overview-ai-chat"
        navigation={navigation}
        messageCreate={messageCreate}
      />
    </section>
  );
}
