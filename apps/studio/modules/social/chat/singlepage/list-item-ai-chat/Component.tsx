"use client";
import type { IComponentProps, IChatListItemProps } from "./interface";
export type { IChatListItemProps } from "./interface";

import { Component as SharedIcon } from "../../../../shared/icon";

import type IconGlyphs from "../../../../shared/icon/singlepage/phosphor/icons.json";
import { memo } from "react";
import type { IAIChatChat } from "../../../profile/singlepage/scope/ai-chat/project/models";
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
  variant = "list-item-ai-chat",
  data,
  selected,
  onSelect,
}: IComponentProps) {
  return (
    <button
      type="button"
      data-ds-block="social.chat.list-item-ai-chat"
      data-chat-id={data.id}
      onClick={() => onSelect(data.id)}
      aria-pressed={selected}
      className={`flex min-h-10 w-full min-w-0 items-center gap-2 rounded-lg px-2 py-2 text-left text-sm font-medium ${kit.focus} ${selected ? "bg-card/10 text-default-foreground" : "text-default-foreground/70 hover:bg-card/10 hover:text-default-foreground"}`}
      data-module="social"
      data-model="chat"
      data-variant={variant}
    >
      <Icon
        name="chat-circle"
        className="size-4 shrink-0 text-default-foreground/50"
      />
      <span className="min-w-0 flex-1 break-words">{data.title}</span>
    </button>
  );
});
