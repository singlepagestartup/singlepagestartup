"use client";
import { Component as ThreadsToMessages } from "../../../../relations/threads-to-messages/index";
import { Component as SocialModuleProfile } from "../../../profile/index";
import { Component as SocialModuleMessage } from "../../../message/index";
import { useCallback, useRef, useEffect, useState } from "react";
import { type IProjectAgent } from "../../../../../../workspace/utils/products/ai-chat-agent-resolver";
import { useThread } from "../ai-chat-products/Thread";
import { orderedThreadMessages } from "../../../../../../workspace/utils/products/ai-chat-threads";

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
        <ThreadsToMessages
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
              <SocialModuleMessage
                variant="ai-chat-message"
                key={message.id}
                message={message}
                agent={message.agent ?? null}
                onSelect={selectProfile}
                showContext
              />
            ))
          }
        </ThreadsToMessages>
        <div ref={end} />
      </div>
      <SocialModuleProfile
        variant="ai-chat-agent"
        agent={profile}
        onClose={() => setProfile(null)}
      />
    </>
  );
}
