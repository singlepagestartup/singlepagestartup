"use client";
import { memo } from "react";
import {
  Icon,
  kit,
} from "../../../../../../workspace/design/singlepage/interface-kit/ai-chat/primitives";
import { useSource } from "../ai-chat-editor/Source";
export interface ISourceDocumentNavigationProps {
  selected: boolean;
  onSelect: () => void;
}
export const Component = memo(function Component({
  selected,
  onSelect,
}: ISourceDocumentNavigationProps) {
  const { source } = useSource();
  return (
    <button
      type="button"
      data-ds-block="knowledge.source.ai-chat-navigation"
      data-source-ids={source.id}
      aria-pressed={selected}
      onClick={onSelect}
      className={`flex min-h-10 w-full min-w-0 items-center gap-2 rounded-lg px-2 py-2 text-left text-sm ${kit.focus} ${selected ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/10 hover:text-white"}`}
    >
      <Icon name="file-text" className="size-4 shrink-0 text-white/50" />
      Products.md
    </button>
  );
});
