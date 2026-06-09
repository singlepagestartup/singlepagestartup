"use client";

import { IClientComponentProps } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import { CollapsibleContent, CollapsibleTrigger } from "@sps/shared-ui-shadcn";
import { Collapsible } from "@radix-ui/react-collapsible";
import { MoreHorizontal } from "lucide-react";

function formatTimelineDate(value?: string | Date | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function Component(props: IClientComponentProps) {
  const createdAt = formatTimelineDate(props.data.createdAt);

  return (
    <Collapsible
      data-module="social"
      data-model="action"
      data-id={props.data?.id || ""}
      data-variant="chat-action-row"
      className={cn(
        "mx-3 my-2 rounded-lg border border-dashed border-slate-200 bg-slate-50/70",
        props.className,
      )}
    >
      <CollapsibleTrigger className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left">
        <span className="min-w-0 truncate text-xs text-slate-500">
          {props.profile.slug} recorded an action
          {createdAt ? ` · ${createdAt}` : ""}
        </span>
        <MoreHorizontal className="h-4 w-4 shrink-0 text-slate-400" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <pre className="mx-3 mb-3 max-h-48 overflow-auto rounded-lg bg-white p-3 text-[11px] leading-5 text-slate-500 ring-1 ring-slate-200">
          {JSON.stringify(props.data.payload, null, 2)}
        </pre>
      </CollapsibleContent>
    </Collapsible>
  );
}
