"use client";
import { Component as KnowledgeModuleSource } from "../../../../knowledge/source/index";
import { useEffect, useRef, type ReactNode } from "react";
import {
  Button,
  Icon,
  kit,
} from "../../../../../workspace/design/singlepage/interface-kit/ai-chat/primitives";
import { useSource } from "../../../../knowledge/source/singlepage/ai-chat-document/Source";

import { Component as Conversation } from "../ai-chat-conversation/index";
import { PanelHeader } from "../../../../../workspace/design/singlepage/interface-kit/ai-chat/ServiceDocument";
import { ThreadProvider, useThread } from "./Thread";
export interface IThreadOverviewProps {
  navigation?: ReactNode;
  messageCreate?: ReactNode;
}
export function Component(props: IThreadOverviewProps) {
  return (
    <ThreadProvider>
      <ThreadOverview {...props} />
    </ThreadProvider>
  );
}

function ThreadOverview({ navigation, messageCreate }: IThreadOverviewProps) {
  const {
    thread,
    pane,
    setPane,
    workingOn,
    discuss,
    proposal,
    apply,
    dismiss,
    error,
  } = useThread();
  const { source } = useSource();
  const proposalView = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (pane === "chat" && proposal)
      proposalView.current?.scrollIntoView({ block: "nearest" });
  }, [pane, proposal]);
  return (
    <div
      data-ds-block="social.thread.ai-chat-overview"
      data-module="social"
      data-model="thread"
      data-id={thread.id}
      data-thread-id={thread.id}
      data-variant="ai-chat-overview"
      data-knowledge-source-ids={source.id}
      className="flex min-h-0 min-w-0 flex-1 flex-col"
      aria-label={thread.title}
    >
      <PanelHeader
        title={thread.title}
        label="Document thread"
        navigation={navigation}
        actions={
          <div className="flex rounded-lg bg-sps-grey p-1 @[900px]/chat:hidden">
            {(["chat", "document"] as const).map((item) => (
              <button
                key={item}
                type="button"
                aria-pressed={pane === item}
                onClick={() => setPane(item)}
                className={`min-h-9 rounded-md px-3 text-xs font-semibold ${kit.focus} ${pane === item ? "bg-sps-white" : kit.muted}`}
              >
                {item === "chat" ? "Chat" : "Document"}
              </button>
            ))}
          </div>
        }
      />
      <div className="grid min-h-0 min-w-0 flex-1 @[900px]/chat:grid-cols-[minmax(0,1fr)_360px]">
        <div
          className={`${pane === "chat" ? "flex" : "hidden"} min-h-0 min-w-0 flex-col overflow-y-auto @[900px]/chat:flex`}
        >
          <div className="min-h-0 flex-1 overflow-y-auto">
            <Conversation className="min-h-[50dvh] @[760px]/workspace:min-h-0" />
            {proposal && (
              <div
                ref={proposalView}
                className="mx-4 mb-4 rounded-xl border border-sps-line bg-sps-grey p-4"
              >
                <p className="text-xs font-semibold">
                  Proposed update · {source.title}
                </p>
                <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6">
                  {proposal.text}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button onClick={apply}>
                    <Icon name="pencil-simple" className="size-4" />
                    Apply to knowledge
                  </Button>
                  <Button variant="plain" onClick={dismiss}>
                    Dismiss
                  </Button>
                </div>
                {error && (
                  <p role="alert" className="mt-3 text-sm">
                    {error}
                  </p>
                )}
              </div>
            )}
          </div>
          {messageCreate}
        </div>
        <div
          className={`${pane === "document" ? "block" : "hidden"} min-h-0 min-w-0 overflow-y-auto border-sps-line @[900px]/chat:block @[900px]/chat:border-l`}
        >
          <KnowledgeModuleSource
            variant="ai-chat-document"
            discussing={workingOn === "source"}
            onDiscuss={discuss}
          />
        </div>
      </div>
    </div>
  );
}
