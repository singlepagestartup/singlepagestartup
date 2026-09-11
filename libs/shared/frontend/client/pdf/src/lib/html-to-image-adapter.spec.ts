/**
 * BDD Suite: HTML capture adapter
 * Given a fixed DOM layout and a larger raster target
 * When the adapter captures it
 * Then it embeds fonts from every page and keeps logical and raster sizes separate
 */
import { htmlToImageCaptureAdapter } from "./html-to-image-adapter";
import { getFontEmbedCSS, toPng, toJpeg } from "html-to-image";
jest.mock("html-to-image", () => ({
  getFontEmbedCSS: jest
    .fn()
    .mockResolvedValue("@font-face{font-family:Fixture}"),
  toPng: jest.fn().mockResolvedValue("data:image/png;base64,image"),
  toJpeg: jest.fn().mockResolvedValue("data:image/jpeg;base64,image"),
}));
const page = {
  sourceWidthPx: 400,
  sourceHeightPx: 800,
  outputWidthPx: 1200,
  outputHeightPx: 2400,
  pdfWidthPt: 300,
  pdfHeightPt: 600,
};
beforeEach(() => jest.clearAllMocks());
afterEach(() => jest.restoreAllMocks());

/** BDD Scenario: Default lossless capture
 * Given two text pages
 * When the default adapter captures both
 * Then PNG is used at explicit raster dimensions with one shared font embedding
 */
it("uses PNG with distinct DOM and raster dimensions and shared embedded fonts", async () => {
  const elements = [
    document.createElement("article"),
    document.createElement("article"),
  ];
  const session = await htmlToImageCaptureAdapter.prepare({
    elements,
    page,
    image: {},
  });
  await session.capture(elements[0]);
  await session.capture(elements[1]);
  expect(getFontEmbedCSS).toHaveBeenCalledTimes(1);
  const discovery = jest.mocked(getFontEmbedCSS).mock.calls[0][0];
  expect(discovery.ownerDocument).toBe(document);
  expect(discovery.isConnected).toBe(false);
  expect(toPng).toHaveBeenCalledWith(
    elements[0],
    expect.objectContaining({
      width: 400,
      height: 800,
      canvasWidth: 1200,
      canvasHeight: 2400,
      pixelRatio: 1,
      skipAutoScale: true,
      fontEmbedCSS: "@font-face{font-family:Fixture}",
    }),
  );
  expect(toJpeg).not.toHaveBeenCalled();
});

/** BDD Scenario: Fonts introduced after the first page
 * Given two pages using different font faces
 * When the second page is captured
 * Then its embedded stylesheet includes the font that was absent from the first page
 */
it("preserves a font face that is used only on a later page", async () => {
  const elements = [
    document.createElement("article"),
    document.createElement("article"),
  ];
  elements[0].style.fontFamily = "FirstPage";
  elements[1].style.fontFamily = "LaterPage";
  jest.mocked(getFontEmbedCSS).mockImplementationOnce(async (discovery) =>
    Array.from(discovery.children)
      .map(
        (element) =>
          `@font-face{font-family:${(element as HTMLElement).style.fontFamily}}`,
      )
      .join("\n"),
  );
  const session = await htmlToImageCaptureAdapter.prepare({
    elements,
    page,
    image: {},
  });
  await session.capture(elements[1]);
  expect(toPng).toHaveBeenCalledWith(
    elements[1],
    expect.objectContaining({
      fontEmbedCSS:
        "@font-face{font-family:FirstPage}\n@font-face{font-family:LaterPage}",
    }),
  );
});

/** BDD Scenario: Typography provided through CSS variables
 * Given a heading whose inline font-family is a CSS variable
 * When fonts are discovered for capture
 * Then the resolved font family is embedded instead of the unresolved variable
 */
it("discovers computed font families behind inline CSS variables", async () => {
  const element = document.createElement("article");
  const heading = document.createElement("h1");
  heading.style.fontFamily = "var(--display-font)";
  element.appendChild(heading);
  const computedStyle = window.getComputedStyle;
  jest.spyOn(window, "getComputedStyle").mockImplementation((node) => {
    const style = computedStyle(node);
    if (node === heading) {
      Object.defineProperty(style, "fontFamily", { value: "DisplayFont" });
    }
    return style;
  });
  await htmlToImageCaptureAdapter.prepare({
    elements: [element],
    page,
    image: {},
  });
  const discovery = jest.mocked(getFontEmbedCSS).mock.calls[0][0];
  const families = Array.from(discovery.children).map(
    (element) => (element as HTMLElement).style.fontFamily,
  );
  expect(families).toContain("DisplayFont");
  expect(families).not.toContain("var(--display-font)");
  expect(heading.style.fontFamily).toBe("var(--display-font)");
});

/** BDD Scenario: Optional photographic compression
 * Given an explicit JPEG format, quality and background
 * When the adapter captures the page
 * Then those photographic settings are respected
 */
it("supports explicit JPEG quality and background", async () => {
  const element = document.createElement("article");
  const session = await htmlToImageCaptureAdapter.prepare({
    elements: [element],
    page,
    image: { format: "jpeg", quality: 0.9, backgroundColor: "#fff" },
  });
  await session.capture(element);
  expect(toJpeg).toHaveBeenCalledWith(
    element,
    expect.objectContaining({ quality: 0.9, backgroundColor: "#fff" }),
  );
  expect(toPng).not.toHaveBeenCalled();
});
