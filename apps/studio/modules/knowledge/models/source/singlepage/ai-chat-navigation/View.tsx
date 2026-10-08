"use client";
import { memo } from "react";
import {
  Icon,
  kit,
} from "../../../../../../workspace/design/singlepage/interface-kit/ai-chat/primitives";
import type { IAIChatSource } from "../../../../../../workspace/utils/products/ai-chat-models";
export interface ISourceDocumentNavigationProps {
  data: {
    id: string;
    title: string;
    sources: IAIChatSource[];
    reviewed: boolean;
  };
  selected: boolean;
  onSelect: (id: string) => void;
}
export const SourceDocumentNavigation = memo(function SourceDocumentNavigation({
  data,
  selected,
  onSelect,
}: ISourceDocumentNavigationProps) {
  return (
    <button
      type="button"
      data-ds-block="knowledge.source.ai-chat-navigation"
      data-source-ids={data.sources.map((source) => source.id).join(",")}
      aria-pressed={selected}
      onClick={() => onSelect(data.id)}
      className={`flex min-h-10 w-full min-w-0 items-center gap-2 rounded-lg px-2 py-2 text-left text-sm ${kit.focus} ${selected ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/10 hover:text-white"}`}
    >
      <Icon name="file-text" className="size-4 shrink-0 text-white/50" />
      <span className="min-w-0 flex-1 break-words">{data.title}.md</span>
      {data.reviewed && (
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
