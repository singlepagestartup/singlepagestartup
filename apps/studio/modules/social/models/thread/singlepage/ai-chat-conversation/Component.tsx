"use client";
import { useCallback, useRef, useEffect, useState } from "react";
import { type IProjectAgent } from "../../../../../../workspace/utils/products/ai-chat-agent-resolver";
import { useThread } from "../ai-chat-products/Thread";
import { orderedThreadMessages } from "../../../../../../workspace/utils/products/ai-chat-threads";
import { Component as ThreadMessages } from "../../../../relations/threads-to-messages/singlepage/ai-chat-find/index";
import { Component as ProjectAgentProfile } from "../../../profile/singlepage/ai-chat-agent/index";
import { Component as ProjectMessageRow } from "../../../message/singlepage/ai-chat-message/index";
export interface IConversationProps {
  className?: string;
}
export function Component({ className = "" }: IConversationProps) {
  const { thread, messages } = useThread();
  const [profile, setProfile] = useState<IProjectAgent | null>(null);
  const selectProfile = useCallback(
    (selected: IProjectAgent) => setProfile(selected),
    [],
  );
  const end = useRef<HTMLDivElement>(null);
  const previous = useRef(messages.length);
  useEffect(() => {
    if (messages.length > previous.current)
      end.current?.scrollIntoView({ block: "nearest", behavior: "instant" });
    previous.current = messages.length;
  }, [messages.length]);
  return (
    <>
      <div
        role="log"
        aria-label="Conversation"
        aria-live="polite"
        className={`${className} space-y-6 p-4 @[640px]:p-6`}
      >
        <ThreadMessages
          variant="find"
          data={messages.map((message, orderIndex) => ({
            id: `${thread.id}:${message.id}`,
            threadId: thread.id,
            messageId: message.id,
            orderIndex,
          }))}
          apiProps={{
            params: {
              filters: {
                and: [{ column: "threadId", method: "eq", value: thread.id }],
              },
            },
          }}
        >
          {(links) =>
            orderedThreadMessages(messages, links).map((message) => (
              <ProjectMessageRow
                key={message.id}
                message={message}
                agent={message.agent ?? null}
                onSelect={selectProfile}
                showContext
              />
            ))
          }
        </ThreadMessages>
        <div ref={end} />
      </div>
      <ProjectAgentProfile agent={profile} onClose={() => setProfile(null)} />
    </>
  );
}
