"use client";

import { useEffect, useRef, useState } from "react";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { Icon } from "../primitives";
import type {
  PDFDocumentProxy,
  PDFDocumentLoadingTask,
  RenderTask,
} from "pdfjs-dist";
import type { IPdfPreviewProps } from "./interface";

export function PdfPreview(props: IPdfPreviewProps) {
  const container = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [document, setDocument] = useState<PDFDocumentProxy>();
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [width, setWidth] = useState(0);
  const [rendering, setRendering] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const element = container.current;
    if (!element) return;
    const resize = () => setWidth(Math.max(1, element.clientWidth - 32));
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let task: PDFDocumentLoadingTask | undefined;
    let active = true;
    setDocument(undefined);
    setError("");
    setPage(1);
    setZoom(1);
    void (async () => {
      try {
        const blob = props.file;
        // Vite resolves the worker asset locally; file bytes stay in this browser.
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
        const data = new Uint8Array(await blob.arrayBuffer());
        if (!active) return;
        task = pdfjs.getDocument({
          data,
          useWasm: false,
          useSystemFonts: true,
        });
        const loaded = await task.promise;
        if (active) setDocument(loaded);
      } catch {
        if (active)
          setError(
            "This PDF could not be displayed. Download the original to open it.",
          );
      }
    })();
    return () => {
      active = false;
      void task?.destroy();
    };
  }, [props.file]);

  useEffect(() => {
    if (!document || !width || !canvas.current) return;
    let active = true;
    let task: RenderTask | undefined;
    const element = canvas.current;
    setRendering(true);
    setError("");
    void (async () => {
      try {
        const loadedPage = await document.getPage(page);
        if (!active) return;
        const base = loadedPage.getViewport({ scale: 1 });
        const scale = Math.min(width / base.width, 1.5) * zoom;
        const viewport = loadedPage.getViewport({ scale });
        element.width = Math.ceil(viewport.width);
        element.height = Math.ceil(viewport.height);
        task = loadedPage.render({ canvas: element, viewport });
        await task.promise;
      } catch {
        if (active)
          setError(
            "This PDF page could not be displayed. Download the original to open it.",
          );
      } finally {
        if (active) setRendering(false);
      }
    })();
    return () => {
      active = false;
      task?.cancel();
    };
  }, [document, page, width, zoom]);

  return (
    <div
      className="flex min-h-0 flex-1 flex-col"
      aria-label={`PDF preview: ${props.file.name}`}
    >
      {document && (
        <div className="flex shrink-0 flex-wrap items-center justify-center gap-2 border-b border-[var(--workspace-brand-line)] p-2">
          <button
            type="button"
            aria-label="Previous page"
            disabled={page === 1}
            onClick={() => setPage((value) => value - 1)}
            className="grid size-9 place-items-center rounded-lg hover:bg-[var(--workspace-brand-background)] disabled:opacity-40"
          >
            <Icon name="caret-left" className="size-4" />
          </button>
          <span className="text-xs tabular-nums" aria-live="polite">
            Page {page} of {document.numPages}
          </span>
          <button
            type="button"
            aria-label="Next page"
            disabled={page === document.numPages}
            onClick={() => setPage((value) => value + 1)}
            className="grid size-9 place-items-center rounded-lg hover:bg-[var(--workspace-brand-background)] disabled:opacity-40"
          >
            <Icon name="caret-right" className="size-4" />
          </button>
          <button
            type="button"
            aria-label="Zoom out"
            disabled={zoom <= 0.5}
            onClick={() => setZoom((value) => Math.max(0.5, value - 0.25))}
            className="grid size-9 place-items-center rounded-lg hover:bg-[var(--workspace-brand-background)] disabled:opacity-40"
          >
            <Icon name="minus" className="size-4" />
          </button>
          <span className="min-w-10 text-center text-xs tabular-nums">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            aria-label="Zoom in"
            disabled={zoom >= 2}
            onClick={() => setZoom((value) => Math.min(2, value + 0.25))}
            className="grid size-9 place-items-center rounded-lg hover:bg-[var(--workspace-brand-background)] disabled:opacity-40"
          >
            <Icon name="plus" className="size-4" />
          </button>
        </div>
      )}
      <div
        ref={container}
        className="min-h-0 flex-1 overflow-auto bg-[var(--workspace-brand-background)] p-4"
      >
        {error && (
          <p
            role="alert"
            className="text-sm text-[var(--workspace-brand-foreground)]"
          >
            {error}
          </p>
        )}
        {!error && (!document || rendering) && (
          <p
            role="status"
            className="mb-3 text-sm text-[var(--workspace-brand-muted)]"
          >
            Loading PDF…
          </p>
        )}
        <canvas
          ref={canvas}
          role="img"
          aria-label={`Page ${page} of ${props.file.name}`}
          className={
            document && !error ? "mx-auto block bg-white shadow-sm" : "hidden"
          }
        />
      </div>
    </div>
  );
}
