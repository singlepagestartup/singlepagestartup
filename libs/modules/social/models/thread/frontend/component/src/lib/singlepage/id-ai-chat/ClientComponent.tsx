"use client";
import { useState } from "react";
import { FileText } from "lucide-react";
import type { IComponentPropsExtended } from "./interface";

export function Component(props: IComponentPropsExtended) {
  const [pane, setPane] = useState("chat");
  return (
    <div
      data-module="social"
      data-model="thread"
      data-variant="id-ai-chat"
      data-id={props.data.id}
      className="flex min-h-0 min-w-0 flex-1 flex-col"
    >
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-card p-4">
        <div className="flex items-center gap-3">
          {props.navigation}
          <div>
            <p className="text-xs text-muted-foreground">
              {props.isDocument ? "Document thread" : "Thread"}
            </p>
            <h2 className="mt-1 text-base font-semibold">{props.data.title}</h2>
          </div>
        </div>
        {props.isDocument && (
          <div className="flex rounded-lg bg-muted p-1 xl:hidden">
            {["chat", "document"].map((item) => (
              <button
                key={item}
                type="button"
                aria-pressed={pane === item}
                onClick={() => setPane(item)}
                className={`min-h-9 rounded-md px-3 text-xs font-semibold capitalize ${pane === item ? "bg-card" : "text-muted-foreground"}`}
              >
                {item}
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
            aria-label={`${props.data.title} editor`}
            data-thread-id={props.data.id}
            className={`${pane === "document" ? "block" : "hidden"} min-h-0 min-w-0 overflow-y-auto border-border bg-muted p-4 xl:block xl:border-l`}
          >
            <div className="mb-4 flex items-center justify-between gap-2">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <FileText className="size-4" />
                {props.data.title}
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
