"use client";
import { memo } from "react";
import {
  Icon,
  kit,
} from "../../../../../../workspace/design/singlepage/interface-kit/ai-chat/primitives";
import { useSource } from "../ai-chat-document/Source";
export interface ISourceDocumentLinkProps {
  selected: boolean;
  href: string;
}
export const Component = memo(function Component({
  selected,
  href,
}: ISourceDocumentLinkProps) {
  const { source } = useSource();
  return (
    <a
      href={href}
      data-ds-block="knowledge.source.ai-chat-document-link"
      data-source-ids={source.id}
      aria-current={selected ? "page" : undefined}
      className={`flex min-h-10 w-full min-w-0 items-center gap-2 rounded-lg px-2 py-2 text-left text-sm ${kit.focus} ${selected ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/10 hover:text-white"}`}
    >
      <Icon name="file-text" className="size-4 shrink-0 text-white/50" />
      Products.md
    </a>
  );
});
