import type { IPdfCaptureAdapter } from "./interface";

function fontDiscoveryElement(elements: readonly HTMLElement[]): HTMLElement {
  const document = elements[0].ownerDocument;
  const probe = document.createElement("div");
  const families = new Set(
    elements.flatMap((element) =>
      [element, ...Array.from(element.querySelectorAll("*"))].map(
        (node) => getComputedStyle(node).fontFamily,
      ),
    ),
  );
  for (const family of families) {
    if (family) {
      const sample = document.createElement("span");
      sample.style.fontFamily = family;
      probe.appendChild(sample);
    }
  }
  return probe;
}

export const htmlToImageCaptureAdapter: IPdfCaptureAdapter = {
  async prepare({ elements, page, image }) {
    const { getFontEmbedCSS, toPng, toJpeg } = await import("html-to-image");
    // A preferred format would silently discard font faces supplied only as TTF/OTF.
    // Discover all pages' computed families, including inline font-family: var(...).
    // html-to-image otherwise prefers unresolved inline values over computed CSS.
    // The detached probe belongs to the source document and never changes its layout.
    const fontEmbedCSS = await getFontEmbedCSS(fontDiscoveryElement(elements));
    const capture = image.format === "jpeg" ? toJpeg : toPng;
    // html-to-image copies computed styles, including compiled Tailwind utilities.
    // fontEmbedCSS separately embeds the @font-face rules and font-file data URLs.
    // html-to-image 1.11.x floors font-size and subtracts 0.1px when cloning.
    // Copy the exact computed font shorthand first, then its other longhands.
    // This preserves fractional sizes/line heights without touching the live DOM.
    const includeStyleProperties = [
      "font",
      ...Array.from(getComputedStyle(elements[0])).filter(
        (property) => property !== "font" && property !== "font-size",
      ),
    ];

    return {
      capture: (element) =>
        capture(element, {
          width: page.sourceWidthPx,
          height: page.sourceHeightPx,
          canvasWidth: page.outputWidthPx,
          canvasHeight: page.outputHeightPx,
          pixelRatio: 1,
          skipAutoScale: true,
          fontEmbedCSS,
          includeStyleProperties,
          backgroundColor: image.backgroundColor,
          quality: image.quality,
        }),
    };
  },
};
