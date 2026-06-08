"use client";

import { IClientComponentProps } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import { AtSign, Pencil, X } from "lucide-react";

export function Component(props: IClientComponentProps) {
  return (
    <span
      data-module="social"
      data-model="skill"
      data-id={props.data?.id || ""}
      data-variant="chat-selected-pill"
      className={cn(
        "inline-flex max-w-full items-center gap-1.5 rounded-full bg-slate-900 px-2.5 py-1 text-xs text-white",
        props.className,
      )}
    >
      <AtSign className="h-3 w-3 shrink-0" />
      <span className="truncate">{props.data.slug}</span>
      {props.onEdit ? (
        <button
          type="button"
          className="ml-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-white"
          onClick={() => {
            props.onEdit?.(props.data);
          }}
          aria-label={`Edit ${props.data.slug}`}
        >
          <Pencil className="h-3 w-3" />
        </button>
      ) : null}
      {props.onRemove ? (
        <button
          type="button"
          className="ml-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-white"
          onClick={() => {
            props.onRemove?.(props.data);
          }}
          aria-label={`Remove ${props.data.slug}`}
        >
          <X className="h-3 w-3" />
        </button>
      ) : null}
    </span>
  );
}
