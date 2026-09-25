import { htmlToImageCaptureAdapter } from "@sps/shared-frontend-client-pdf";

/** Capture a fixed artboard, reusing the same font/image renderer as PDF export. */
export async function captureArtifactPng(
  element: HTMLElement,
  width: number,
  height: number,
): Promise<string> {
  if (
    ![width, height].every(
      (value) => Number.isInteger(value) && value > 0 && value <= 8192,
    )
  )
    throw new Error("Artboard dimensions must be between 1 and 8192 pixels.");
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      (async () => {
        await element.ownerDocument.fonts.ready;
        await Promise.all(
          Array.from(element.querySelectorAll("img")).map(async (image) => {
            image.loading = "eager";
            await image.decode();
            if (!image.naturalWidth)
              throw new Error("An artboard image did not load.");
          }),
        );
      })(),
      new Promise((_, reject) => {
        timer = setTimeout(
          () =>
            reject(
              new Error(
                "Images or fonts did not finish loading. Retry when they are available.",
              ),
            ),
          30000,
        );
      }),
    ]);
    const capture = await htmlToImageCaptureAdapter.prepare({
      elements: [element],
      page: {
        sourceWidthPx: width,
        sourceHeightPx: height,
        outputWidthPx: width,
        outputHeightPx: height,
        pdfWidthPt: width,
        pdfHeightPt: height,
      },
      image: { format: "png" },
    });
    return await capture.capture(element);
  } finally {
    clearTimeout(timer);
  }
}

export function downloadMedia(url: string, fileName: string) {
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
}
