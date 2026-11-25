"use client";
import { useId, useState } from "react";
import { FileText, PanelRightClose, PanelRightOpen } from "lucide-react";
import type { IChatThreadPanelProps } from "./interface";

/** The production Thread and the local landing preview share this pane layout. */
export function ChatThreadPanel(props: IChatThreadPanelProps) {
  const [localPane, setLocalPane] = useState<"chat" | "context">("chat");
  const pane = props.pane ?? localPane;
  const setPane = props.onPaneChange ?? setLocalPane;
  const [localContextOpen, setLocalContextOpen] = useState(false);
  const contextOpen = props.contextOpen ?? localContextOpen;
  const setContextOpen = props.onContextOpenChange ?? setLocalContextOpen;
  const contextId = useId();
  const ru = props.language === "ru";
  const hasContext = !props.isDocument && Boolean(props.context);
  const showContext = hasContext && contextOpen;
  const hideMobileChat = props.isDocument ? pane === "context" : showContext;
  const hasDesktopColumns = props.isDocument || showContext;
  const contextToggleLabel = contextOpen
    ? ru
      ? "Скрыть правую панель"
      : "Hide right sidebar"
    : ru
      ? "Показать правую панель"
      : "Show right sidebar";
  const ContextToggleIcon = contextOpen ? PanelRightClose : PanelRightOpen;

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <header
        className={`flex shrink-0 items-center justify-between gap-3 border-b border-border bg-card ${props.isProjectThread ? "flex-wrap p-4" : "px-4 py-3 lg:min-h-16 lg:py-2"}`}
      >
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {props.navigation}
          <div className="min-w-0">
            <h2
              className="min-w-0 break-words text-base font-semibold lg:truncate"
              title={props.titleContent ? undefined : props.title}
            >
              {props.titleContent ?? props.title}
            </h2>
          </div>
        </div>
        {props.isDocument && (
          <div
            className="flex rounded-lg bg-muted p-1 xl:hidden"
            role="group"
            aria-label={ru ? "Панель проекта" : "Project pane"}
          >
            {(["chat", "context"] as const).map((item) => (
              <button
                key={item}
                type="button"
                aria-pressed={pane === item}
                onClick={() => setPane(item)}
                className={`min-h-9 rounded-md px-3 text-xs font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground ${pane === item ? "bg-card" : "text-muted-foreground"}`}
              >
                {item === "chat"
                  ? ru
                    ? "Чат"
                    : "Chat"
                  : ru
                    ? "Документ"
                    : "Document"}
              </button>
            ))}
          </div>
        )}
        {hasContext && (
          <button
            type="button"
            aria-label={contextToggleLabel}
            aria-expanded={contextOpen}
            aria-controls={contextId}
            title={contextToggleLabel}
            onClick={() => setContextOpen(!contextOpen)}
            className="grid size-10 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <ContextToggleIcon className="size-5" aria-hidden="true" />
          </button>
        )}
      </header>
      <div
        className={`grid min-h-0 min-w-0 flex-1 ${hasDesktopColumns ? "xl:grid-cols-[minmax(0,1fr)_360px]" : ""}`}
      >
        <div
          className={`${hideMobileChat ? "hidden" : "flex"} min-h-0 min-w-0 flex-col xl:flex`}
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
            className={`${pane === "context" ? "block" : "hidden"} min-h-0 min-w-0 space-y-4 overflow-y-auto border-border bg-muted p-3 xl:block xl:border-l`}
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
        {hasContext && (
          <aside
            id={contextId}
            data-thread-id={props.threadId}
            aria-label={ru ? "Контекст" : "Context"}
            hidden={!showContext}
            className="min-h-0 min-w-0 overflow-y-auto overscroll-contain border-border bg-muted p-4 xl:border-l"
          >
            {props.context}
          </aside>
        )}
      </div>
    </div>
  );
}
