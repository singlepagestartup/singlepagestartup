"use client";
import { memo } from "react";
import {
  Icon,
  kit,
} from "../../../../../workspace/design/singlepage/interface-kit/ai-chat/primitives";
import type { IAIChatChat } from "../../../../../workspace/utils/products/ai-chat-models";
export interface IChatNavigationProps {
  data: IAIChatChat;
  selected: boolean;
  onSelect: (id: string) => void;
}
export const Component = memo(function Component({
  data,
  selected,
  onSelect,
}: IChatNavigationProps) {
  return (
    <button
      type="button"
      data-ds-block="social.chat.ai-chat-navigation"
      data-chat-id={data.id}
      onClick={() => onSelect(data.id)}
      aria-pressed={selected}
      className={`flex min-h-10 w-full min-w-0 items-center gap-2 rounded-lg px-2 py-2 text-left text-sm font-medium ${kit.focus} ${selected ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/10 hover:text-white"}`}
    >
      <Icon name="chat-circle" className="size-4 shrink-0 text-white/50" />
      <span className="min-w-0 flex-1 break-words">{data.title}</span>
    </button>
  );
});
