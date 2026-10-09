"use client";
import { memo } from "react";
import {
  Icon,
  kit,
} from "../../../../../../workspace/design/singlepage/interface-kit/ai-chat/primitives";
import type { IAIChatThread } from "../../../../../../workspace/utils/products/ai-chat-threads";

export interface IThreadButtonProps {
  data?: IAIChatThread;
  id: string;
  name: string;
  topic?: boolean;
  selected: boolean;
  reviewed?: boolean;
  onSelect: (id: string) => void;
}

export const Component = memo(function Component({
  data,
  id,
  name,
  topic,
  selected,
  reviewed,
  onSelect,
}: IThreadButtonProps) {
  return (
    <button
      type="button"
      data-ds-block="social.thread.ai-chat-sidebar-item"
      data-module="social"
      data-model="thread"
      data-id={data?.id ?? id}
      data-thread-id={data?.id ?? id}
      onClick={() => onSelect(id)}
      aria-pressed={selected}
      className={`flex min-h-10 w-full min-w-0 items-center gap-2 rounded-lg px-2 py-2 text-left text-sm ${topic ? "font-medium" : "font-normal"} ${kit.focus} ${selected ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/10 hover:text-white"}`}
    >
      <Icon
        name={topic ? "chat-circle" : "file-text"}
        className="size-4 shrink-0 text-white/50"
      />
      <span className="min-w-0 flex-1 break-words">{name}</span>
      {reviewed && !topic && (
        <>
          <span className="inline-flex size-3.5 shrink-0 items-center justify-center rounded-full bg-sps-green text-sps-graphite">
            <Icon name="check" className="size-[8.4px]" />
          </span>
          <span className="sr-only">Reviewed</span>
        </>
      )}
    </button>
  );
});
