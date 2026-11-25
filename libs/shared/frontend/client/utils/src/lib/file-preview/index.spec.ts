import { getFilePreviewKind, getFilePreviewUrl } from "./index";

it.each([
  ["photo.PNG", "application/octet-stream", "image"],
  ["speech.webm", "audio/webm;codecs=opus", "audio"],
  ["speech.mp4", "audio/mp4", "audio"],
  ["speech.wav", "audio/vnd.wave", "audio"],
  ["screen.webm", "", "video"],
  ["clip.ogv", "application/ogg", "video"],
  ["clip.ogg", "video/ogg", "video"],
  ["speech.oga", "application/ogg", "audio"],
  ["report.md", "text/plain", "markdown"],
  ["/public/demo.htm?version=2", "text/html", "html"],
  ["drawing.svg", "image/png", "unsupported"],
  ["drawing.svg.png", "image/png", "unsupported"],
  ["drawing.png", "image/svg+xml", "unsupported"],
  ["code.js", "text/plain", "unsupported"],
  ["code.png", "application/javascript", "unsupported"],
  ["motion.mp4", "text/html", "unsupported"],
  ["document.pdf", "video/mp4", "unsupported"],
  ["image.tiff", "image/tiff", "unsupported"],
])("classifies %s with %s as %s", (name, mimeType, kind) => {
  expect(getFilePreviewKind({ name, mimeType })).toBe(kind);
});

it("checks the stored name and extension alongside the display name", () => {
  expect(
    getFilePreviewKind({
      name: "preview.png",
      extension: "svg",
      mimeType: "image/png",
    }),
  ).toBe("unsupported");
  expect(
    getFilePreviewKind({
      name: "preview.png",
      src: "/public/code%2Ejs?v=3",
      mimeType: "image/png",
    }),
  ).toBe("unsupported");
});

it.each([
  "javascript:void(0)",
  "data:text/plain,hello",
  "/\\example.test",
  "//example.test",
])("rejects unsafe source %s", (value) => {
  expect(getFilePreviewUrl(value)).toBeUndefined();
});
