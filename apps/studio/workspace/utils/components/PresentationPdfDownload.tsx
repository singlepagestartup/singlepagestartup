"use client";

import { useCallback, useEffect, useRef, type ReactNode } from "react";
import { Download } from "lucide-react";
import {
  useElementPdfDownload,
  type ICreatePdfFromElementsOptions,
} from "@sps/shared-frontend-client-pdf";

interface IPresentationPdfDownloadProps {
  children: ReactNode;
  fileName: string;
  title: string;
}

const rasterScale = 2;
const pointsPerCssPixel = 72 / 96;

function pdfOptions(
  container: HTMLElement | null,
  title: string,
): ICreatePdfFromElementsOptions {
  const elements = Array.from(
    container?.querySelectorAll<HTMLElement>("[data-slide-id]") ?? [],
  );
  const first = elements[0];
  if (!first) {
    throw new Error("This presentation has no pages to export.");
  }
  const sourceWidthPx = first.offsetWidth;
  const sourceHeightPx = first.offsetHeight;
  if (
    elements.some(
      (element) =>
        element.offsetWidth !== sourceWidthPx ||
        element.offsetHeight !== sourceHeightPx,
    )
  ) {
    throw new Error("Presentation pages must use one size.");
  }
  return {
    elements,
    page: {
      sourceWidthPx,
      sourceHeightPx,
      outputWidthPx: sourceWidthPx * rasterScale,
      outputHeightPx: sourceHeightPx * rasterScale,
      pdfWidthPt: sourceWidthPx * pointsPerCssPixel,
      pdfHeightPt: sourceHeightPx * pointsPerCssPixel,
    },
    metadata: { title, subject: "Product presentation", creator: "SPS Studio" },
  };
}

/** Browser export controls shared by every product's Presentation tab. */
export function PresentationPdfDownload({
  children,
  fileName,
  title,
}: IPresentationPdfDownloadProps) {
  const container = useRef<HTMLDivElement>(null);
  const { status, url, error, generate, reset } = useElementPdfDownload();
  const prepare = useCallback(
    () => generate(() => pdfOptions(container.current, title)),
    [generate, title],
  );

  useEffect(() => {
    reset();
    return reset;
  }, [children, fileName, title, reset]);

  return (
    <section data-pdf-export-state={status} aria-label="Presentation export">
      <div className="flex flex-col gap-4 border-b border-slate-200 bg-slate-50 px-5 py-5 sm:flex-row sm:items-center sm:justify-between md:px-8">
        <div>
          <h2 className="text-base font-semibold text-slate-950">
            Presentation PDF
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Prepare the current slides when you need a download.
          </p>
        </div>
        {url ? (
          <a
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
            href={url}
            download={fileName}
          >
            <Download aria-hidden="true" size={18} />
            Download PDF
          </a>
        ) : (
          <button
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 disabled:cursor-wait disabled:opacity-60"
            disabled={status === "loading"}
            onClick={() => void prepare()}
            type="button"
          >
            <Download aria-hidden="true" size={18} />
            {status === "loading"
              ? "Preparing PDF…"
              : status === "error"
                ? "Retry PDF"
                : "Prepare PDF"}
          </button>
        )}
      </div>
      {error ? (
        <p
          role="alert"
          className="bg-red-50 px-5 py-4 text-sm text-red-800 md:px-8"
        >
          Could not prepare the PDF: {error.message}
        </p>
      ) : null}
      <div ref={container}>{children}</div>
    </section>
  );
}
