"use client";
import {
  Button,
  Icon,
} from "../../../../../workspace/design/singlepage/interface-kit/ai-chat/primitives";
import { useSource } from "../ai-chat-document/Source";

export interface ISourceDownloadProps {
  label?: string;
}
export function Component({ label = ".md" }: ISourceDownloadProps) {
  const { source } = useSource();
  function download() {
    const url = URL.createObjectURL(
      new Blob([`# ${source.title}\n\n${source.content}\n`], {
        type: "text/markdown;charset=utf-8",
      }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `${source.title}.md`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <Button
      data-ds-block="knowledge.source.ai-chat-download"
      variant="secondary"
      aria-label={`Download ${source.title}.md`}
      onClick={download}
    >
      <Icon name="arrow-down" />
      {label}
    </Button>
  );
}
