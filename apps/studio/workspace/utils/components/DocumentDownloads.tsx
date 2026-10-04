import { useState, type RefObject } from "react";
import { ArrowDown as Download } from "./ModuleIcons";

import {
  downloadFileName,
  downloadSlug,
  markdownDownloadContent,
  standaloneHtmlDownload,
} from "../downloads";
import { downloadMedia } from "../media/png";

export interface IDocumentDownloadsProps {
  fileName: string;
  htmlTargetRef?: RefObject<HTMLElement | null>;
  htmlUrl?: string;
  markdown?: string;
  markdownTitle?: string;
  theme?: "dark" | "light";
  title: string;
}

function downloadText(content: string, type: string, fileName: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  downloadMedia(url, fileName);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Download the canonical text and the currently rendered standalone page. */
export function DocumentDownloads({
  fileName,
  htmlTargetRef,
  htmlUrl,
  markdown,
  markdownTitle,
  theme = "light",
  title,
}: IDocumentDownloadsProps) {
  const [preparingHtml, setPreparingHtml] = useState(false);
  const buttonClass =
    theme === "dark"
      ? "border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-primary)] text-white  hover:border-[var(--workspace-brand-line)] hover:bg-[var(--workspace-brand-primary)]"
      : "border-[var(--workspace-brand-line)] bg-white text-[var(--workspace-brand-muted)]  hover:-translate-y-px hover:border-[var(--workspace-brand-line)] hover:bg-[var(--workspace-brand-background)] hover:text-[var(--workspace-brand-foreground)] active:translate-y-0";
  const baseName = downloadSlug(fileName);
  const htmlName = downloadFileName(baseName, "html");
  const hasHtml = Boolean(htmlUrl || htmlTargetRef);
  if (!markdown && !hasHtml) return null;
  return (
    <div
      data-export-controls
      data-download-base-name={baseName}
      className="flex flex-wrap items-center gap-2"
    >
      {markdown ? (
        <button
          type="button"
          onClick={() =>
            downloadText(
              markdownDownloadContent(markdown, markdownTitle),
              "text/markdown;charset=utf-8",
              downloadFileName(baseName, "md"),
            )
          }
          aria-label="Download Markdown"
          title="Download Markdown"
          className={`inline-flex items-center gap-2 min-h-11 rounded-xl border px-4 py-2 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-[var(--workspace-brand-focus)] ${buttonClass}`}
        >
          <Download aria-hidden="true" size={20} />
          <span>.md</span>
        </button>
      ) : null}
      {htmlUrl ? (
        <a
          href={htmlUrl}
          download={htmlName}
          aria-label="Download HTML"
          title="Download HTML"
          className={`inline-flex items-center gap-2 min-h-11 rounded-xl border px-4 py-2 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-[var(--workspace-brand-focus)] ${buttonClass}`}
        >
          <Download aria-hidden="true" size={20} />
          <span>.html</span>
        </a>
      ) : htmlTargetRef ? (
        <button
          type="button"
          onClick={async () => {
            if (!htmlTargetRef.current) return;
            setPreparingHtml(true);
            try {
              downloadText(
                await standaloneHtmlDownload(htmlTargetRef.current, title),
                "text/html;charset=utf-8",
                htmlName,
              );
            } finally {
              setPreparingHtml(false);
            }
          }}
          aria-label={preparingHtml ? "Preparing HTML" : "Download HTML"}
          title="Download HTML"
          disabled={preparingHtml}
          className={`inline-flex items-center gap-2 min-h-11 rounded-xl border px-4 py-2 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-[var(--workspace-brand-focus)] disabled:cursor-wait disabled:opacity-60 ${buttonClass}`}
        >
          <Download aria-hidden="true" size={20} />
          <span>{preparingHtml ? "Preparing HTML…" : ".html"}</span>
        </button>
      ) : null}
    </div>
  );
}
