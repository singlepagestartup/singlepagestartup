"use client";

import { IClientComponentProps } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import { FileText } from "lucide-react";

function formatKnowledgeDate(value?: string | Date | null) {
  if (!value) {
    return "Not indexed";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not indexed";
  }

  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function Component(props: IClientComponentProps) {
  return (
    <button
      type="button"
      data-module="knowledge"
      data-model="document"
      data-id={props.data?.id || ""}
      data-variant="chat-sidebar-item"
      onClick={() => {
        props.onSelect?.(props.data);
      }}
      className={cn(
        "flex w-full max-w-full min-w-0 items-start gap-2 overflow-hidden rounded-lg border px-3 py-2 text-left transition",
        props.isSelected
          ? "border-slate-300 bg-slate-100"
          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50",
        props.className,
      )}
    >
      <FileText className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
      <span className="w-0 min-w-0 flex-1 overflow-hidden">
        <span
          className="block max-w-full truncate text-xs font-medium text-slate-700"
          title={props.data.title}
        >
          {props.data.title}
        </span>
        <span className="mt-0.5 block max-w-full truncate text-[11px] text-slate-400">
          {formatKnowledgeDate(props.data.lastIndexedAt)}
        </span>
      </span>
      {props.needsReindex ? (
        <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] text-amber-700">
          stale
        </span>
      ) : null}
    </button>
  );
}
