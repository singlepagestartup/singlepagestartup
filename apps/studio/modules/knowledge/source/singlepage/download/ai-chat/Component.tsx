"use client";
import type { IComponentProps, ISourceDownloadProps } from "./interface";
export type { ISourceDownloadProps } from "./interface";

import { Component as SharedIcon } from "../../../../../shared/icon";

import type IconGlyphs from "../../../../../shared/icon/singlepage/phosphor/icons.json";
import { useSource } from "../../id/ai-chat/Source";
function Icon(props: {
  name: keyof typeof IconGlyphs;
  size?: 20 | 24;
  className?: string;
  svgProps?: React.SVGProps<SVGSVGElement>;
}) {
  return <SharedIcon {...props} variant="phosphor" />;
}

export function Component({
  variant = "download-ai-chat",
  label = ".md",
}: IComponentProps) {
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
    <span
      className="inline-flex"
      data-module="knowledge"
      data-model="source"
      data-variant={variant}
    >
      <button
        type="button"
        data-ds-block="knowledge.source.download-ai-chat"
        aria-label={`Скачать ${source.title}.md`}
        onClick={download}
        className="inline-flex min-h-11 max-w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-5 py-2 text-sm font-semibold text-foreground transition motion-reduce:transition-none enabled:cursor-pointer enabled:hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
      >
        <Icon name="arrow-down" />
        {label}
      </button>
    </span>
  );
}
