"use client";
import {
  Button,
  Icon,
} from "../../../../../../../workspace/design/singlepage/interface-kit/ai-chat/primitives";
import {
  Component as SourceCard,
  type ISourceCardProps,
} from "../../ai-chat/index";
import { Component as SourceDownload } from "../../../download/ai-chat";
import { useSource } from "./Source";

export interface ISourceDocumentProps extends ISourceCardProps {}
export function Component(props: ISourceDocumentProps) {
  const { source } = useSource();
  const documentName = `${source.title}.md`;
  return (
    <section
      aria-label={`${documentName} editor`}
      className="min-w-0 bg-sps-grey p-4"
    >
      <div className="mb-4 flex items-center justify-between gap-2">
        <h3 className="inline-flex items-center gap-2 text-sm font-semibold">
          <Icon name="file-text" />
          {documentName}
        </h3>
        <SourceDownload />
      </div>
      <SourceCard {...props} />
    </section>
  );
}
