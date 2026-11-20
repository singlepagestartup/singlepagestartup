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
  const ru = props.language === "ru";

  return (
    <Collapsible
      data-module="social"
      data-model="action"
      data-id={props.data?.id || ""}
      data-variant="chat-action-row"
      className={cn(
        "rounded-xl border border-dashed border-border bg-muted/50",
        props.className,
      )}
    >
      <CollapsibleTrigger className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left">
        <span className="min-w-0 truncate text-xs text-muted-foreground">
          {ru
            ? `Действие профиля ${props.profile.slug}`
            : `${props.profile.slug} recorded an action`}
          {createdAt ? ` · ${createdAt}` : ""}
        </span>
        <MoreHorizontal
          className="size-4 shrink-0 text-muted-foreground"
          aria-hidden="true"
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <pre className="mx-3 mb-3 max-h-48 overflow-auto rounded-lg border border-border bg-card p-3 text-[11px] leading-5 text-muted-foreground">
          {JSON.stringify(props.data.payload, null, 2)}
        </pre>
      </CollapsibleContent>
    </Collapsible>
  );
}
