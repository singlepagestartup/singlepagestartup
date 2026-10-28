"use client";
import { Component as SocialModuleProfile } from "../../../../profile/index";
import { Component as MessageOverview } from "../../overview/ai-chat/index";
import {
  useCallback,
  useRef,
  useEffect,
  useLayoutEffect,
  useState,
} from "react";
import { type IProjectAgent } from "../../../../profile/singlepage/agent/overview/ai-chat/resolver";
import type { IProjectMessage } from "../../../../profile/singlepage/scope/ai-chat/project/state";

export interface IMessageListProps {
  threadId: string;
  messages: IProjectMessage[];
  className?: string;
}
export function Component({
  threadId,
  messages,
  className = "",
}: IMessageListProps) {
  const [profile, setProfile] = useState<IProjectAgent | null>(null);
  const selectProfile = useCallback(
    (selected: IProjectAgent) => setProfile(selected),
    [],
  );
  const end = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const followingLatest = useRef(true);
  const latest = messages[messages.length - 1];
  useLayoutEffect(() => {
    const pane = list.current?.closest<HTMLElement>("[data-ai-chat-messages]");
    if (pane) {
      followingLatest.current = true;
      pane.scrollTop = pane.scrollHeight;
    }
  }, [latest?.id, latest?.text, messages.length]);
  useEffect(() => {
    const content = list.current,
      pane = content?.closest<HTMLElement>("[data-ai-chat-messages]");
    if (!content || !pane) return;
    const onScroll = () => {
      followingLatest.current =
        pane.scrollHeight - pane.scrollTop - pane.clientHeight < 80;
    };
    pane.addEventListener("scroll", onScroll, { passive: true });
    const observer =
      typeof ResizeObserver === "undefined"
        ? undefined
        : new ResizeObserver(() => {
            if (followingLatest.current) pane.scrollTop = pane.scrollHeight;
          });
    observer?.observe(content);
    return () => {
      pane.removeEventListener("scroll", onScroll);
      observer?.disconnect();
    };
  }, []);
  return (
    <>
      <div
        ref={list}
        data-ds-block="social.message.list-ai-chat"
        data-module="social"
        data-model="message"
        data-thread-id={threadId}
        data-variant="list-ai-chat"
        role="log"
        aria-label="Сообщения"
        aria-live="polite"
        className={`${className}`}
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
        <div ref={end} />
      </div>
      <SocialModuleProfile
        variant="agent-overview-ai-chat"
        agent={profile}
        onClose={() => setProfile(null)}
      />
    </>
  );
}
