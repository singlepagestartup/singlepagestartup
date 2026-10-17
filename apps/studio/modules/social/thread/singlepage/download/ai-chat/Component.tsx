"use client";
import type { IComponentProps, IThreadDownloadProps } from "./interface";
export type { IThreadDownloadProps } from "./interface";

import { Component as SharedIcon } from "../../../../../shared/icon";

import type { IAIChatSource } from "../../../../profile/singlepage/scope/ai-chat/project/models";
import { threadDocumentMarkdown } from "../../id/ai-chat/state";

export function Component({
  variant = "download-ai-chat",
  threadId,
  fileName,
  sources,
}: IComponentProps) {
  function download() {
    const url = URL.createObjectURL(
      new Blob([threadDocumentMarkdown(fileName, sources)], {
        type: "text/markdown;charset=utf-8",
      }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = /\.md$/i.test(fileName) ? fileName : `${fileName}.md`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <button
      type="button"
      data-module="social"
      data-model="thread"
      data-variant={variant}
      data-thread-id={threadId}
      data-knowledge-source-ids={sources.map((source) => source.id).join(" ")}
      aria-label={`Download ${fileName}`}
      onClick={download}
      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-card px-5 py-2 text-sm font-semibold transition hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
    >
      <SharedIcon variant="phosphor" name="arrow-down" />
      .md
    </button>
  );
}
