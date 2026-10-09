"use client";
import { useCallback, useRef, useEffect, useState } from "react";
import {
  documentAgent,
  type IProjectAgent,
} from "../../../../../../workspace/utils/products/ai-chat-agent-resolver";
import type { IProjectMessage } from "../../../../../../workspace/utils/products/ai-chat-workspace";
import { Component as ProjectAgentProfile } from "../../../profile/singlepage/ai-chat-agent/index";
import { Component as ProjectMessageRow } from "../../../message/singlepage/ai-chat-message/index";
export interface IConversationProps {
  messages: IProjectMessage[];
  agent?: IProjectAgent | null;
  showContext?: boolean;
  className?: string;
}

export function Component({
  messages,
  agent = documentAgent("thread"),
  showContext = true,
  className = "",
}: IConversationProps) {
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
        {messages.map((message) => (
          <ProjectMessageRow
            key={message.id}
            message={message}
            agent={message.agent === undefined ? agent : message.agent}
            onSelect={selectProfile}
            showContext={showContext}
          />
        ))}
        <div ref={end} />
      </div>
      <ProjectAgentProfile agent={profile} onClose={() => setProfile(null)} />
    </>
  );
}
