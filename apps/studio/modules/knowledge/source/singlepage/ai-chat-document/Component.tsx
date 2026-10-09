"use client";
import {
  Button,
  Icon,
} from "../../../../../workspace/design/singlepage/interface-kit/ai-chat/primitives";
import {
  Component as SourceCard,
  type ISourceCardProps,
} from "../ai-chat-card/index";
import { useSource } from "./Source";

export interface ISourceDocumentProps extends ISourceCardProps {}
interface ISourceDownloadProps {
  label?: string;
}
export function SourceDownload({ label = ".md" }: ISourceDownloadProps) {
  const { source } = useSource();
  function download() {
    const url = URL.createObjectURL(
      new Blob([`# Products\n\n## ${source.title}\n\n${source.content}\n`], {
        type: "text/markdown;charset=utf-8",
      }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "Products.md";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <Button
      variant="secondary"
      aria-label="Download Products.md"
      onClick={download}
    >
      <Icon name="arrow-down" />
      {label}
    </Button>
  );
}
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
