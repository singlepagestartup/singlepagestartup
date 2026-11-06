"use client";
import type { IComponentProps, IChatIdProps } from "./interface";
export type { IChatIdProps } from "./interface";

import { Component as Thread } from "../../../../thread/index";
import type { ReactNode } from "react";

export function Component({
  variant = "id-ai-chat",
  chatId = "project-chat",
  navigation,
  messageCreate,
  thread,
}: IComponentProps) {
  return (
    <section
      data-ds-block="social.chat.id-ai-chat"
      data-id={chatId}
      data-chat-id={chatId}
      className="@container/chat flex min-h-0 min-w-0 flex-1 flex-col"
      aria-label="Текущий чат"
      data-module="social"
      data-model="chat"
      data-variant={variant}
    >
      {thread ?? (
        <Thread
          variant="id-ai-chat"
          navigation={navigation}
          messageCreate={messageCreate}
        />
      )}
    </section>
  );
}
