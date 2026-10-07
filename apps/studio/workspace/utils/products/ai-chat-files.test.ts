import { expect, test } from "bun:test";
import { readProjectFiles } from "./ai-chat-files";

test("retains original image bytes for preview without inventing an interpretation", async () => {
  const original = new File(
    [new Uint8Array([137, 80, 78, 71])],
    "Reference.png",
    { type: "image/png" },
  );
  const [image, notes] = await readProjectFiles(
    [
      original,
      new File(["A workshop for beginners."], "Notes.md", {
        type: "text/markdown",
      }),
    ],
    "sources",
  );
  try {
    expect(image.mimeType).toBe("image/png");
    expect(image.text).toBe("");
    expect(image.fileUrl).toStartWith("blob:");
    expect(
      new Uint8Array(await (await fetch(image.fileUrl!)).arrayBuffer()),
    ).toEqual(new Uint8Array(await original.arrayBuffer()));
    expect(notes.text).toBe("A workshop for beginners.");
    expect(notes.id).not.toBe(image.id);
  } finally {
    URL.revokeObjectURL(image.fileUrl!);
    URL.revokeObjectURL(notes.fileUrl!);
  }
});

test("rejects oversized text before retaining any files", async () => {
  await expect(
    readProjectFiles([new File(["x".repeat(100001)], "Long.md")], "source"),
  ).rejects.toThrow("shorter text file");
});
