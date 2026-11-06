"use client";
import type { IComponentProps, IThreadMessageListProps } from "./interface";
export type { IThreadMessageListProps } from "./interface";

import { Component as Message } from "../../../../../message/index";
import { useThread } from "../../../id/ai-chat/Thread";

export function Component({
  variant = "message-list-ai-chat",
  className,
}: IComponentProps) {
  const { thread, messages } = useThread();
  return (
    <div
      data-ds-block="social.thread.message-list-ai-chat"
      data-thread-id={thread.id}
      className="min-w-0"
      data-module="social"
      data-model="thread"
      data-variant={variant}
    >
      <Message
        variant="list-ai-chat"
        threadId={thread.id}
        messages={messages}
        className={className}
      />
    </div>
  );
}
