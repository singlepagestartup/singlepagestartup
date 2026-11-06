"use client";
import { useState } from "react";
import { FileText } from "lucide-react";
import type { IChatThreadPanelProps } from "./interface";

/** The production Thread and the local landing preview share this pane layout. */
export function ChatThreadPanel(props: IChatThreadPanelProps) {
  const [localPane, setLocalPane] = useState<"chat" | "document">("chat");
  const pane = props.pane ?? localPane;
  const setPane = props.onPaneChange ?? setLocalPane;
  const ru = props.language === "ru";
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
                  ? "Обсуждение проекта"
                  : "Thread"}
            </p>
            <h2 className="mt-1 break-words text-base font-semibold">
              {props.title}
            </h2>
          </div>
        </div>
        {props.isDocument && (
          <div
            className="flex rounded-lg bg-muted p-1 xl:hidden"
            role="group"
            aria-label={ru ? "Панель проекта" : "Project pane"}
          >
            {(["chat", "document"] as const).map((item) => (
              <button
                key={item}
                type="button"
                aria-pressed={pane === item}
                onClick={() => setPane(item)}
                className={`min-h-9 rounded-md px-3 text-xs font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground ${pane === item ? "bg-card" : "text-muted-foreground"}`}
              >
                {ru
                  ? item === "chat"
                    ? "Чат"
                    : "Документ"
                  : item === "chat"
                    ? "Chat"
                    : "Document"}
              </button>
            ))}
          </div>
        )}
      </header>
      <div
        className={`grid min-h-0 min-w-0 flex-1 ${props.isDocument ? "xl:grid-cols-[minmax(0,1fr)_360px]" : ""}`}
      >
        <div
          className={`${!props.isDocument || pane === "chat" ? "flex" : "hidden"} min-h-0 min-w-0 flex-col xl:flex`}
        >
          <div data-ai-chat-messages className="min-h-0 flex-1 overflow-y-auto">
            {props.messages}
          </div>
          {props.composer}
        </div>
        {props.isDocument && (
          <section
            data-thread-id={props.threadId}
            aria-label={`${props.title}${ru ? " — редактор" : " editor"}`}
            className={`${pane === "document" ? "block" : "hidden"} min-h-0 min-w-0 overflow-y-auto border-border bg-muted p-4 xl:block xl:border-l`}
          >
            <div className="mb-4 flex items-center justify-between gap-2">
              <h3 className="flex min-w-0 items-center gap-2 text-sm font-semibold">
                <FileText className="size-4 shrink-0" />
                {props.title}
              </h3>
              {props.documentDownload}
            </div>
            <div className="grid gap-4">{props.knowledge}</div>
          </section>
        )}
      </div>
    </div>
  );
}
