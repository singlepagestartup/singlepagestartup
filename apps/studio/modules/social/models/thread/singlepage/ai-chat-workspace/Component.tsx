"use client";
import { useEffect, useRef, type ReactNode } from "react";
import {
  Button,
  Icon,
  kit,
} from "../../../../../../workspace/design/singlepage/interface-kit/ai-chat/primitives";
import type { IAIChatThread } from "../../../../../../workspace/utils/products/ai-chat-threads";
import { useSource } from "../../../../../knowledge/models/source/singlepage/ai-chat-editor/Source";
import { Component as SourceEditor } from "../../../../../knowledge/models/source/singlepage/ai-chat-editor/index";
import { Component as Conversation } from "../ai-chat-conversation/index";
import { Component as Composer } from "../ai-chat-composer/index";
import { ThreadProvider, useThread } from "./Thread";
export interface IThreadHeaderProps {
  title: string;
  label: string;
  navigation?: ReactNode;
  actions?: ReactNode;
}
export interface IThreadWorkspaceProps {
  data: IAIChatThread;
  navigation?: ReactNode;
}
export function ThreadHeader({
  title,
  label,
  navigation,
  actions,
}: IThreadHeaderProps) {
  return (
    <header className="sticky top-18 z-10 flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-sps-line bg-sps-white p-4 @[760px]/workspace:top-0">
      <div className="flex min-w-0 items-center gap-3">
        {navigation}
        <div className="min-w-0">
          <p className={`text-xs ${kit.muted}`}>{label}</p>
          <h2 className="mt-1 break-words text-base font-semibold">{title}</h2>
        </div>
      </div>
      {actions}
    </header>
  );
}

export function Component({ data, navigation }: IThreadWorkspaceProps) {
  return (
    <ThreadProvider key={data.id} data={data}>
      <ThreadContent navigation={navigation} />
    </ThreadProvider>
  );
}
function ThreadContent({
  navigation,
}: Pick<IThreadWorkspaceProps, "navigation">) {
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
      data-ds-block="social.thread.ai-chat-workspace"
      data-module="social"
      data-model="thread"
      data-id={thread.id}
      data-thread-id={thread.id}
      data-variant="ai-chat-workspace"
      data-knowledge-source-ids={source.id}
      className="flex min-h-0 min-w-0 flex-1 flex-col"
      aria-label={thread.title}
    >
      <ThreadHeader
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
          <Composer />
        </div>
        <div
          className={`${pane === "document" ? "block" : "hidden"} min-h-0 min-w-0 overflow-y-auto border-sps-line @[900px]/chat:block @[900px]/chat:border-l`}
        >
          <SourceEditor
            discussing={workingOn === "source"}
            onDiscuss={discuss}
          />
        </div>
      </div>
    </div>
  );
}
