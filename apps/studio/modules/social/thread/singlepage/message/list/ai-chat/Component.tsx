"use client";
import { Component as SocialModuleMessage } from "../../../../../message/index";
import { useThread } from "../../../overview/ai-chat/Thread";

export interface IThreadMessageListProps {
  className?: string;
}

export function Component({ className }: IThreadMessageListProps) {
  const { thread, messages } = useThread();
  return (
    <div
      data-ds-block="social.thread.message-list-ai-chat"
      data-thread-id={thread.id}
      className="min-w-0"
    >
      <SocialModuleMessage
        variant="list-ai-chat"
        threadId={thread.id}
        messages={messages}
        className={className}
      />
    </div>
  );
}
