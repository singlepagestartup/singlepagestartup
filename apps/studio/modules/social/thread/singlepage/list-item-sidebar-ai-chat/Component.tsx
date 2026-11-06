"use client";
import type { IComponentProps, IThreadListItemProps } from "./interface";
export type { IThreadListItemProps } from "./interface";

import { Component as SharedIcon } from "../../../../shared/icon";

import type IconGlyphs from "../../../../shared/icon/singlepage/phosphor/icons.json";
import { memo } from "react";
import type { IAIChatThread } from "../id/ai-chat/state";
function Icon(props: {
  name: keyof typeof IconGlyphs;
  size?: 20 | 24;
  className?: string;
  svgProps?: React.SVGProps<SVGSVGElement>;
}) {
  return <SharedIcon {...props} variant="phosphor" />;
}

const focus =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground";
const buttonBase =
  "inline-flex min-h-11 max-w-full items-center justify-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold transition motion-reduce:transition-none enabled:cursor-pointer disabled:cursor-not-allowed disabled:opacity-50";
const kit = {
  focus: focus,
};
export const Component = memo(function Component({
  variant = "list-item-sidebar-ai-chat",
  data,
  id,
  name,
  topic,
  selected,
  onSelect,
}: IComponentProps) {
  return (
    <button
      type="button"
      data-ds-block="social.thread.list-item-sidebar-ai-chat"
      data-id={data?.id ?? id}
      data-thread-id={data?.id ?? id}
      onClick={() => onSelect(id)}
      aria-pressed={selected}
      className={`flex min-h-10 w-full min-w-0 items-center gap-2 rounded-lg px-2 py-2 text-left text-sm ${topic ? "font-medium" : "font-normal"} ${kit.focus} ${selected ? "bg-card/10 text-default-foreground" : "text-default-foreground/70 hover:bg-card/10 hover:text-default-foreground"}`}
      data-module="social"
      data-model="thread"
      data-variant={variant}
    >
      <Icon
        name={topic ? "chat-circle" : "file-text"}
        className="size-4 shrink-0 text-default-foreground/50"
      />
      <span className="min-w-0 flex-1 break-words">{name}</span>
    </button>
  );
});
