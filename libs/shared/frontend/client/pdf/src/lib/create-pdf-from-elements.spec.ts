/**
 * BDD Suite: Browser element PDF assembly
 * Given mounted pages, delayed resources and an interchangeable capture adapter
 * When a PDF is requested
 * Then resources finish before capture and the document preserves geometry and order
 */
import { createPdfFromElements } from "./create-pdf-from-elements";
import type { IPdfCaptureAdapter, IPdfPageGeometry } from "./interface";
import { jsPDF } from "jspdf";

const mockPdf = {
  setProperties: jest.fn(),
  addPage: jest.fn(),
  addImage: jest.fn(),
  output: jest.fn(() => new Blob(["%PDF-test"], { type: "application/pdf" })),
};
jest.mock("jspdf", () => ({ jsPDF: jest.fn(() => mockPdf) }));

const page: IPdfPageGeometry = {
  sourceWidthPx: 400,
  sourceHeightPx: 800,
  outputWidthPx: 1200,
  outputHeightPx: 2400,
  pdfWidthPt: 300,
  pdfHeightPt: 600,
};
function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}
function mount(id: string) {
  const element = document.createElement("article");
  element.id = id;
  document.body.append(element);
  return element;
}
function attachImage(element: HTMLElement) {
  const image = document.createElement("img");
  image.src = "/diagram.png";
  Object.defineProperties(image, {
    complete: { value: true, configurable: true },
    naturalWidth: { value: 80, configurable: true },
    naturalHeight: { value: 80, configurable: true },
    decode: {
      value: jest.fn().mockResolvedValue(undefined),
      configurable: true,
    },
  });
  element.append(image);
  return image;
}
const capture = jest.fn(async (element: HTMLElement) => element.id);
const adapter: IPdfCaptureAdapter = {
  prepare: jest.fn(async () => ({ capture })),
};
beforeEach(() => {
  jest.clearAllMocks();
  document.body.innerHTML = "";
  Object.defineProperty(document, "fonts", {
    value: { ready: Promise.resolve() },
    configurable: true,
  });
});

/** BDD Scenario: Empty input
 * Given no pages
 * When export is requested
 * Then an actionable error is returned before capture
 */
it("rejects an empty page list", async () => {
  await expect(createPdfFromElements({ elements: [], page })).rejects.toThrow(
    "at least one page",
  );
  expect(adapter.prepare).not.toHaveBeenCalled();
});

/** BDD Scenario: Delayed fonts and decoded images
 * Given unfinished fonts and a cached but undecoded image
 * When export starts
 * Then capture waits for both resources
 */
it("waits for fonts and successful image decoding even for complete images", async () => {
  const fonts = deferred();
  const decoded = deferred();
  Object.defineProperty(document, "fonts", {
    value: { ready: fonts.promise },
    configurable: true,
  });
  const element = mount("first");
  const image = attachImage(element);
  (image.decode as jest.Mock).mockReturnValue(decoded.promise);
  const result = createPdfFromElements({
    elements: [element],
    page,
    captureAdapter: adapter,
  });
  await Promise.resolve();
  expect(adapter.prepare).not.toHaveBeenCalled();
  fonts.resolve();
  await new Promise((resolve) => setTimeout(resolve, 0));
  expect(image.decode).toHaveBeenCalledTimes(1);
  expect(capture).not.toHaveBeenCalled();
  decoded.resolve();
  await result;
  expect(capture).toHaveBeenCalledWith(element);
});

/** BDD Scenario: Broken resource
 * Given an image that fails decoding
 * When export waits for the image
 * Then the error names the failed resource and no partial PDF is returned
 */
it("identifies an image that failed to decode", async () => {
  const element = mount("broken");
  const image = attachImage(element);
  (image.decode as jest.Mock).mockRejectedValue(new Error("decode failed"));
  await expect(
    createPdfFromElements({
      elements: [element],
      page,
      captureAdapter: adapter,
    }),
  ).rejects.toThrow("could not load image /diagram.png");
  expect(capture).not.toHaveBeenCalled();
});

/** BDD Scenario: Broken image dimensions
 * Given a decoded image without intrinsic pixels
 * When export checks image readiness
 * Then it rejects the unloaded image
 */
it("rejects an image with no loaded pixels", async () => {
  const element = mount("empty-image");
  const image = attachImage(element);
  Object.defineProperty(image, "naturalWidth", { value: 0 });
  await expect(
    createPdfFromElements({
      elements: [element],
      page,
      captureAdapter: adapter,
    }),
  ).rejects.toThrow("could not load image");
});

/** BDD Scenario: Page assembly
 * Given pages in a caller-defined order, metadata and separate physical dimensions
 * When all pages are captured
 * Then a Blob contains exactly that document with PNG pages in the supplied order
 */
it("preserves page order, count, metadata, physical size and Blob output", async () => {
  const second = mount("second");
  const first = mount("first");
  const metadata = {
    title: "Guide",
    author: "Author",
    creator: "Editor",
    subject: "Topic",
  };
  const result = await createPdfFromElements({
    elements: [first, second],
    page,
    metadata,
    captureAdapter: adapter,
  });
  expect(capture.mock.calls.map(([element]) => element.id)).toEqual([
    "first",
    "second",
  ]);
  expect(jsPDF).toHaveBeenCalledWith({
    compress: true,
    format: [300, 600],
    orientation: "portrait",
    unit: "pt",
  });
  expect(adapter.prepare).toHaveBeenCalledWith(
    expect.objectContaining({ page, image: { format: "png" } }),
  );
  expect(mockPdf.addPage).toHaveBeenCalledTimes(1);
  expect(mockPdf.addImage.mock.calls).toEqual([
    ["first", "PNG", 0, 0, 300, 600, undefined, "FAST"],
    ["second", "PNG", 0, 0, 300, 600, undefined, "FAST"],
  ]);
  expect(mockPdf.setProperties).toHaveBeenCalledWith(metadata);
  expect(mockPdf.output).toHaveBeenCalledWith("blob");
  expect(result).toBeInstanceOf(Blob);
  expect(result.type).toBe("application/pdf");
});

/** BDD Scenario: Invalid proportions
 * Given raster and physical sizes that would stretch the layout
 * When export validates the page
 * Then it rejects the mismatched aspect ratio
 */
it("rejects stretching between DOM, raster and PDF units", async () => {
  await expect(
    createPdfFromElements({
      elements: [mount("one")],
      page: { ...page, pdfWidthPt: 400 },
    }),
  ).rejects.toThrow("same aspect ratio");
});

/** BDD Scenario: Resource deadline
 * Given fonts that never become ready
 * When the resource deadline expires
 * Then an actionable timeout is returned
 */
it("times out stalled resources", async () => {
  Object.defineProperty(document, "fonts", {
    value: { ready: new Promise(() => {}) },
    configurable: true,
  });
  await expect(
    createPdfFromElements({
      elements: [mount("one")],
      page,
      resourceTimeoutMs: 10,
    }),
  ).rejects.toThrow("timed out waiting for document fonts");
});

/** BDD Scenario: Cancellation
 * Given a generation waiting for fonts
 * When its signal is aborted
 * Then the wait ends and capture never starts
 */
it("cancels a pending resource wait", async () => {
  Object.defineProperty(document, "fonts", {
    value: { ready: new Promise(() => {}) },
    configurable: true,
  });
  const controller = new AbortController();
  const result = createPdfFromElements({
    elements: [mount("one")],
    page,
    signal: controller.signal,
    captureAdapter: adapter,
  });
  controller.abort();
  await expect(result).rejects.toMatchObject({ name: "AbortError" });
  expect(capture).not.toHaveBeenCalled();
});
