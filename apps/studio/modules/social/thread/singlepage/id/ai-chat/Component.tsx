"use client";
import type { IComponentProps, IThreadIdProps } from "./interface";
export type { IThreadIdProps } from "./interface";

import { Component as SharedIcon } from "../../../../../shared/icon";

import { type ReactNode as ReactNodePresentation, type ReactNode } from "react";
import { Component as ThreadMessageList } from "../../message/list/ai-chat/index";
import { ThreadProvider, useThread } from "./Thread";

interface IPanelHeaderProps {
  title: string;
  label: string;
  navigation?: ReactNodePresentation;
  actions?: ReactNodePresentation;
}
function PanelHeader({ title, label, navigation, actions }: IPanelHeaderProps) {
  return (
    <header className="sticky top-0 z-10 flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border bg-card p-4">
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

export function Component(props: IComponentProps) {
  return (
    <ThreadProvider>
      <ThreadId {...props} variant={props.variant ?? "id-ai-chat"} />
    </ThreadProvider>
  );
}
function ThreadId({
  variant = "id-ai-chat",
  navigation,
  messageCreate,
  knowledge,
  knowledgeUpdate,
  knowledgeSourceIds,
  documentDownload,
}: IThreadIdProps) {
  const { thread, pane, setPane } = useThread();
  return (
    <div
      data-ds-block="social.thread.id-ai-chat"
      data-id={thread.id}
      data-thread-id={thread.id}
      data-knowledge-source-ids={knowledgeSourceIds?.join(" ")}
      className="flex min-h-0 min-w-0 flex-1 flex-col"
      aria-label={thread.title}
      data-module="social"
      data-model="thread"
      data-variant={variant}
    >
      <PanelHeader
        title={thread.title}
        label="Обсуждение документа"
        navigation={navigation}
        actions={
          <div className="flex rounded-lg bg-muted p-1 @[800px]/chat:hidden">
            {(["chat", "document"] as const).map((item) => (
              <button
                key={item}
                type="button"
                aria-pressed={pane === item}
                onClick={() => setPane(item)}
                className={`min-h-9 rounded-md px-3 text-xs font-semibold ${kit.focus} ${pane === item ? "bg-card" : kit.muted}`}
              >
                {item === "chat" ? "Чат" : "Документ"}
              </button>
            ))}
          </div>
        }
      />
      <div className="grid min-h-0 min-w-0 flex-1 @[800px]/chat:grid-cols-[minmax(0,1fr)_360px]">
        <div
          className={`${pane === "chat" ? "flex" : "hidden"} min-h-0 min-w-0 flex-col overflow-y-auto @[800px]/chat:flex`}
        >
          <div data-ai-chat-messages className="min-h-0 flex-1 overflow-y-auto">
            <ThreadMessageList className="min-h-[50dvh] @[760px]/workspace:min-h-0" />
            {knowledgeUpdate}
          </div>
          {messageCreate}
        </div>
        <div
          className={`${pane === "document" ? "block" : "hidden"} min-h-0 min-w-0 overflow-y-auto border-border @[800px]/chat:block @[800px]/chat:border-l`}
        >
          <section
            aria-label={`${thread.title} — редактор`}
            data-thread-id={thread.id}
            className="min-w-0 bg-muted p-4"
          >
            <div className="mb-4 flex items-center justify-between gap-2">
              <h3 className="inline-flex items-center gap-2 text-sm font-semibold">
                <SharedIcon variant="phosphor" name="file-text" />
                {thread.title}
              </h3>
              {documentDownload}
            </div>
            <div className="grid gap-4">{knowledge}</div>
          </section>
        </div>
      </div>
    </div>
  );
}
const focus =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground";
const kit = {
  muted: "text-muted-foreground",
  focus: focus,
};
