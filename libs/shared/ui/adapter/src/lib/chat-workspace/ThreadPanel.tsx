"use client";
import { useState } from "react";
import { FileText, PanelRight } from "lucide-react";
import type { IChatThreadPanelProps } from "./interface";

/** The production Thread and the local landing preview share this pane layout. */
export function ChatThreadPanel(props: IChatThreadPanelProps) {
  const [localPane, setLocalPane] = useState<"chat" | "document">("chat");
  const pane = props.pane ?? localPane;
  const setPane = props.onPaneChange ?? setLocalPane;
  const ru = props.language === "ru";
  const isProjectThread = props.isProjectThread ?? true;
  const hasSidePane = props.isDocument || Boolean(props.context);
  const sidePaneLabel = props.isDocument
    ? ru
      ? "Документ"
      : "Document"
    : ru
      ? "Контекст"
      : "Context";
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border bg-card p-4">
        <div className="flex min-w-0 items-center gap-3">
          {props.navigation}
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">
              {props.isDocument
                ? ru
                  ? "Обсуждение документа"
                  : "Document thread"
                : ru
                  ? isProjectThread
                    ? "Обсуждение проекта"
                    : "Обсуждение"
                  : "Thread"}
            </p>
            <h2 className="mt-1 break-words text-base font-semibold">
              {props.title}
            </h2>
          </div>
        </div>
        {hasSidePane && (
          <div
            className="flex rounded-lg bg-muted p-1 xl:hidden"
            role="group"
            aria-label={
              props.isDocument
                ? ru
                  ? "Панель проекта"
                  : "Project pane"
                : ru
                  ? "Панель обсуждения"
                  : "Thread pane"
            }
          >
            {(["chat", "document"] as const).map((item) => (
              <button
                key={item}
                type="button"
                aria-pressed={pane === item}
                onClick={() => setPane(item)}
                className={`min-h-9 rounded-md px-3 text-xs font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground ${pane === item ? "bg-card" : "text-muted-foreground"}`}
              >
                {item === "chat" ? (ru ? "Чат" : "Chat") : sidePaneLabel}
              </button>
            ))}
          </div>
        )}
      </header>
      <div
        className={`grid min-h-0 min-w-0 flex-1 ${hasSidePane ? "xl:grid-cols-[minmax(0,1fr)_360px]" : ""}`}
      >
        <div
          className={`${!hasSidePane || pane === "chat" ? "flex" : "hidden"} min-h-0 min-w-0 flex-col xl:flex`}
        >
          <div
            data-ai-chat-messages={props.messagesOwnScroll ? undefined : true}
            className={
              props.messagesOwnScroll
                ? "flex min-h-0 flex-1 flex-col overflow-hidden"
                : "min-h-0 flex-1 overflow-y-auto"
            }
          >
            {props.messages}
          </div>
          {props.composer}
        </div>
        {props.isDocument && (
          <section
            data-thread-id={props.threadId}
            aria-label={`${props.title}${ru ? " — редактор" : " editor"}`}
            className={`${pane === "document" ? "block" : "hidden"} min-h-0 min-w-0 space-y-4 overflow-y-auto border-border bg-muted p-3 xl:block xl:border-l`}
          >
            <article className="min-w-0 rounded-xl border border-border bg-card text-card-foreground">
              <header className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
                <h3 className="flex min-w-0 items-center gap-2 text-sm font-semibold">
                  <FileText className="size-4 shrink-0" aria-hidden="true" />
                  <span className="break-words">{props.title}</span>
                </h3>
                {props.documentDownload}
              </header>
              <div className="grid min-w-0 gap-4 p-3">{props.knowledge}</div>
            </article>
            {props.context}
          </section>
        )}
        {!props.isDocument && props.context && (
          <aside
            data-thread-id={props.threadId}
            aria-label={sidePaneLabel}
            className={`${pane === "document" ? "block" : "hidden"} min-h-0 min-w-0 overflow-y-auto overscroll-contain border-border bg-muted p-4 xl:block xl:border-l`}
          >
            <h3 className="mb-5 flex items-center gap-2 text-sm font-semibold">
              <PanelRight className="size-4 shrink-0" aria-hidden="true" />
              {sidePaneLabel}
            </h3>
            {props.context}
          </aside>
        )}
      </div>
    </div>
  );
}
