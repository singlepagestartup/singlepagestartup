"use client";
import type { IComponentProps, IMessageListProps } from "./interface";
import { useChatScroll } from "@sps/shared-frontend-client-utils/chat-scroll";
export type { IMessageListProps } from "./interface";

import { Component as KnowledgeModuleSource } from "../../../../knowledge/source/index";
import { useProfileSources } from "../../../../knowledge/source/singlepage/id/ai-chat/Source";
import { Component as Profile } from "../../../profile/index";
import { Component as MessageOverview } from "../id/ai-chat/index";
import { useCallback, useState } from "react";
import { type IProjectAgent } from "../../../profile/singlepage/agent/id/ai-chat/resolver";
import type { IProjectMessage } from "../../../profile/singlepage/scope/ai-chat/project/state";

export function Component({
  variant = "list-ai-chat",
  threadId,
  messages,
  className = "",
}: IComponentProps) {
  const sources = useProfileSources();
  const [profile, setProfile] = useState<IProjectAgent | null>(null);
  const selectProfile = useCallback(
    (selected: IProjectAgent) => setProfile(selected),
    [],
  );
  const { list, hasNew, followLatest } = useChatScroll({
    identity: threadId,
    revision: messages,
    count: messages.length,
  });
  return (
    <>
      <div
        ref={list}
        data-ds-block="social.message.list-ai-chat"
        data-thread-id={threadId}
        role="log"
        aria-label="Messages"
        aria-live="polite"
        className={`${className} space-y-6 p-4 @[640px]:p-6`}
        data-module="social"
        data-model="message"
        data-variant={variant}
      >
        {messages.map((message) => (
          <MessageOverview
            key={message.id}
            message={message}
            agent={message.agent ?? null}
            onSelect={selectProfile}
            showContext
          />
        ))}
        {hasNew && (
          <button
            type="button"
            onClick={followLatest}
            className="sticky bottom-3 rounded-full border border-border bg-card px-4 py-2 text-sm shadow-sm"
          >
            New messages
          </button>
        )}
      </div>
      <Profile
        variant="agent-id-ai-chat"
        agent={profile}
        knowledgeCount={sources.length}
        knowledge={
          sources.length
            ? sources.map((source) => (
                <KnowledgeModuleSource
                  key={source.id}
                  variant="id-sidebar-ai-chat"
                  data={source}
                />
              ))
            : undefined
        }
        onClose={() => setProfile(null)}
      />
    </>
  );
}
