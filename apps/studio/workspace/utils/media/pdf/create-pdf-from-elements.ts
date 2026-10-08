import { htmlToImageCaptureAdapter } from "./html-to-image-adapter";
import { throwIfAborted } from "./abort";
import type { ICreatePdfFromElementsOptions } from "./interface";

function waitForResource<T>(
  promise: Promise<T>,
  label: string,
  timeoutMs: number,
  signal?: AbortSignal,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const abort = () =>
      finish(() =>
        reject(new DOMException("PDF generation cancelled", "AbortError")),
      );
    const timer = setTimeout(
      () =>
        finish(() => reject(new Error(`PDF: timed out waiting for ${label}`))),
      timeoutMs,
    );
    function finish(callback: () => void) {
      clearTimeout(timer);
      signal?.removeEventListener("abort", abort);
      callback();
    }
    signal?.addEventListener("abort", abort, { once: true });
    if (signal?.aborted) {
      abort();
    }
    promise.then(
      (value) => finish(() => resolve(value)),
      (cause) =>
        finish(() =>
          reject(new Error(`PDF: could not load ${label}`, { cause })),
        ),
    );
  });
}

/** Browser-only PDF generation; no downloads, object URLs, or source DOM changes. */
export async function createPdfFromElements(
  options: ICreatePdfFromElementsOptions,
): Promise<Blob> {
  const { page, metadata, signal, resourceTimeoutMs = 30_000 } = options;
  const elements = [...options.elements];
  if (!elements.length) {
    throw new Error("PDF: at least one page element is required");
  }
  if (typeof document === "undefined") {
    throw new Error("PDF generation works only in a browser");
  }
  throwIfAborted(signal);
  const sizes = Object.values(page);
  if (
    sizes.length !== 6 ||
    sizes.some((value) => !Number.isFinite(value) || value <= 0)
  ) {
    throw new Error("PDF: all page dimensions must be positive finite numbers");
  }
  if (
    !Number.isInteger(page.outputWidthPx) ||
    !Number.isInteger(page.outputHeightPx)
  ) {
    throw new Error("PDF: raster dimensions must be whole pixels");
  }
  const ratio = page.sourceWidthPx / page.sourceHeightPx;
  if (
    [
      page.outputWidthPx / page.outputHeightPx,
      page.pdfWidthPt / page.pdfHeightPt,
    ].some((value) => Math.abs(value / ratio - 1) > 0.000001)
  ) {
    throw new Error(
      "PDF: DOM, raster, and PDF pages must have the same aspect ratio",
    );
  }
  if (!Number.isFinite(resourceTimeoutMs) || resourceTimeoutMs <= 0) {
    throw new Error("PDF: resourceTimeoutMs must be positive");
  }
  if (
    options.image?.quality !== undefined &&
    (!Number.isFinite(options.image.quality) ||
      options.image.quality < 0 ||
      options.image.quality > 1)
  ) {
    throw new Error("PDF: image quality must be between 0 and 1");
  }
  const ownerDocument = elements[0].ownerDocument;
  if (
    elements.some(
      (element) =>
        element.ownerDocument !== ownerDocument || !element.isConnected,
    )
  ) {
    throw new Error("PDF: pages must be mounted in the same document");
  }
  await waitForResource(
    ownerDocument.fonts.ready,
    "document fonts",
    resourceTimeoutMs,
    signal,
  );
  const images = new Set(
    elements.flatMap((element) => [
      ...(element.tagName === "IMG" ? [element as HTMLImageElement] : []),
      ...Array.from(element.querySelectorAll("img")),
    ]),
  );
  await Promise.all(
    [...images].map(async (image) => {
      const label = `image ${image.currentSrc || image.getAttribute("src") || image.alt || "(missing source)"}`;
      await waitForResource(
        Promise.resolve().then(() => image.decode()),
        label,
        resourceTimeoutMs,
        signal,
      );
      if (
        !image.complete ||
        image.naturalWidth === 0 ||
        image.naturalHeight === 0
      ) {
        throw new Error(`PDF: could not load ${label}`);
      }
    }),
  );
  throwIfAborted(signal);
  const image = { ...options.image, format: options.image?.format ?? "png" };
  const adapter = options.captureAdapter ?? htmlToImageCaptureAdapter;
  const [{ jsPDF }, session] = await Promise.all([
    import("jspdf"),
    adapter.prepare({ elements, page, image, signal }),
  ]);
  throwIfAborted(signal);
  const format: [number, number] = [page.pdfWidthPt, page.pdfHeightPt];
  const orientation =
    page.pdfWidthPt > page.pdfHeightPt ? "landscape" : "portrait";
  const pdf = new jsPDF({ compress: true, format, orientation, unit: "pt" });
  if (metadata) {
    pdf.setProperties(metadata);
  }
  for (const [index, element] of elements.entries()) {
    throwIfAborted(signal);
    const raster = await session.capture(element);
    throwIfAborted(signal);
    if (index > 0) {
      pdf.addPage(format, orientation);
    }
    pdf.addImage(
      raster,
      image.format.toUpperCase(),
      0,
      0,
      page.pdfWidthPt,
      page.pdfHeightPt,
      undefined,
      "FAST",
    );
  }
  return pdf.output("blob");
}
