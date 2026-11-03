import {
  assertSupportedAiChatAttachments,
  isSupportedAiChatAttachment,
} from "./index";
it("allows supported images and text documents but rejects SVG and mismatched MIME types", () => {
  expect(
    isSupportedAiChatAttachment({ name: "Photo.JPG", type: "image/jpeg" }),
  ).toBe(true);
  expect(isSupportedAiChatAttachment({ name: "notes.md", type: "" })).toBe(
    true,
  );
  expect(
    isSupportedAiChatAttachment({ name: "logo.svg", type: "image/svg+xml" }),
  ).toBe(false);
  expect(
    isSupportedAiChatAttachment({ name: "logo.png", type: "image/svg+xml" }),
  ).toBe(false);
  expect(
    isSupportedAiChatAttachment({ name: "video.mp4", type: "video/mp4" }),
  ).toBe(false);
  expect(isSupportedAiChatAttachment({ name: "file.constructor" })).toBe(false);
  expect(isSupportedAiChatAttachment({ name: "file.__proto__" })).toBe(false);
  expect(() =>
    assertSupportedAiChatAttachments([
      { name: "good.png", type: "image/png" },
      { name: "bad.svg", type: "image/svg+xml" },
    ]),
  ).toThrow("bad.svg");
});
