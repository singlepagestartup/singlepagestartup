"use client";
import { ArrowDown } from "lucide-react";
import type { IComponentPropsExtended } from "./interface";
export function Component(props: IComponentPropsExtended) {
  return (
    <button
      data-module="social"
      data-model="thread"
      data-variant={props.variant}
      aria-label="Download current Thread as Markdown"
      type="button"
      onClick={props.onDownload}
      disabled={props.pending}
      className="flex min-h-10 items-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-semibold hover:bg-muted disabled:opacity-50"
    >
      <ArrowDown className="size-4" />
      .md
    </button>
  );
}
