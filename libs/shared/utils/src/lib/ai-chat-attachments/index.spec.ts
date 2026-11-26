import {
  assertSupportedAiChatAttachments,
  isSupportedAiChatAttachment,
  readChatAttachmentBlob,
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

it("accepts HTML only for Social messages and keeps standalone SVG blocked", () => {
  for (const name of ["demo.html", "demo.HTM"]) {
    const file = { name, type: "text/html; charset=utf-8" };
    expect(() =>
      assertSupportedAiChatAttachments([file], "message"),
    ).not.toThrow();
    expect(() => assertSupportedAiChatAttachments([file])).toThrow(
      "Unsupported files",
    );
    expect(
      isSupportedAiChatAttachment({ name, type: "image/svg+xml" }, "message"),
    ).toBe(false);
  }
});

it.each([
  ["voice.wav", "audio/wav"],
  ["podcast.m4a", "audio/mp4"],
  ["clip.mp4", "video/mp4"],
  ["meeting.webm", "audio/webm;codecs=opus"],
  ["legacy.mp4", "application/octet-stream"],
])(
  "accepts %s for conversation messages and keeps knowledge formats scoped",
  (name, type) => {
    expect(isSupportedAiChatAttachment({ name, type }, "message")).toBe(true);
    expect(isSupportedAiChatAttachment({ name, type }, "knowledge")).toBe(
      false,
    );
  },
);

it("cancels a protected response above the text preview limit before reading its bytes", async () => {
  const response = new Response(new Uint8Array([1, 2, 3]), {
    headers: { "Content-Length": "3" },
  });
  const blob = jest.spyOn(response, "blob");
  const cancel = jest.spyOn(response.body!, "cancel");
  await expect(readChatAttachmentBlob(response, 2)).rejects.toThrow(
    "too large",
  );
  expect(blob).not.toHaveBeenCalled();
  expect(cancel).toHaveBeenCalled();
});

it("returns the exact protected bytes at the text preview limit", async () => {
  const response = new Response("hello", {
    headers: { "Content-Type": "application/octet-stream" },
  });
  const blob = await readChatAttachmentBlob(response, 5);
  expect(blob.type).toBe("application/octet-stream");
  await expect(blob.text()).resolves.toBe("hello");
});
