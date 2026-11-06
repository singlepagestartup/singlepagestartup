"use client";
import type { IComponentProps, ISourceDocumentLinkProps } from "./interface";
export type { ISourceDocumentLinkProps } from "./interface";

import { Component as SharedIcon } from "../../../../shared/icon";

import type IconGlyphs from "../../../../shared/icon/singlepage/phosphor/icons.json";
import { memo } from "react";
import { useSource } from "../id/ai-chat/Source";
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
  variant = "list-item-document-ai-chat",
  selected,
  href,
}: IComponentProps) {
  const { source } = useSource();
  return (
    <a
      href={href}
      data-ds-block="knowledge.source.list-item-document-ai-chat"
      data-source-ids={source.id}
      aria-current={selected ? "page" : undefined}
      className={`flex min-h-10 w-full min-w-0 items-center gap-2 rounded-lg px-2 py-2 text-left text-sm ${kit.focus} ${selected ? "bg-card/10 text-default-foreground" : "text-default-foreground/70 hover:bg-card/10 hover:text-default-foreground"}`}
      data-module="knowledge"
      data-model="source"
      data-variant={variant}
    >
      <Icon
        name="file-text"
        className="size-4 shrink-0 text-default-foreground/50"
      />
      {source.title}.md
    </a>
  );
});
