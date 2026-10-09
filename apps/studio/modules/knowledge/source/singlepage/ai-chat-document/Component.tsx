"use client";
import {
  Button,
  Icon,
} from "../../../../../workspace/design/singlepage/interface-kit/ai-chat/primitives";
import {
  Component as SourceCard,
  type ISourceCardProps,
} from "../ai-chat-card/index";
import { Component as SourceDownload } from "../ai-chat-download";

export interface ISourceDocumentProps extends ISourceCardProps {}
export function Component(props: ISourceDocumentProps) {
  return (
    <section
      aria-label="Products.md editor"
      className="min-w-0 bg-sps-grey p-4"
    >
      <div className="mb-4 flex items-center justify-between gap-2">
        <h3 className="inline-flex items-center gap-2 text-sm font-semibold">
          <Icon name="file-text" />
          Products.md
        </h3>
        <SourceDownload />
      </div>
      <SourceCard {...props} />
    </section>
  );
}
