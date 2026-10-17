import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { Component as File } from "../../index";
import { FilesProvider } from "./Files";
import { readProjectFiles } from "./utils";
import { aiChatAttachmentFixture } from "../../../../social/profile/singlepage/scope/ai-chat/project/fixtures";
import {
  moveThreadAttachment,
  reorderThreadAttachment,
  appendThreadExchange,
} from "../../../../social/thread/singlepage/id/ai-chat/state";
import { aiChatSourceFixture } from "../../../../social/profile/singlepage/scope/ai-chat/project/fixtures";
import { knowledgeAgent } from "../../../../social/profile/singlepage/agent/id/ai-chat";
function renderAttachments(
  props: { initialExpanded?: boolean; pendingFileId?: string } = {},
) {
  const files = aiChatAttachmentFixture();
  return renderToStaticMarkup(
    <FilesProvider
      initialFiles={[
        ...files,
        { ...files[0], id: "foreign", name: "Another section.jpg" },
      ]}
    >
      <File
        variant="list-attachments-ai-chat"
        section="Brief"
        fileIds={files.map((file) => file.id)}
        onAttach={() => undefined}
        onRemove={() => undefined}
        {...props}
      />
    </FilesProvider>,
  );
}
test("Knowledge files keep their count and original links while initially showing two cards", () => {
  const html = renderAttachments();
  expect(html).toContain("Files · 13");
  expect((html.match(/aria-label="Open /g) ?? []).length).toBe(2);
  expect(html).toContain("Show more");
  expect(html).toContain('target="_blank"');
  expect(html).not.toContain("Another section.jpg");
  expect(html).not.toContain("Audience notes.md");
});
test("expanded Knowledge exposes every linked file with a collapse control", () => {
  const html = renderAttachments({ initialExpanded: true });
  expect((html.match(/aria-label="Open /g) ?? []).length).toBe(13);
  expect(html).toContain("Audience notes.md");
  expect(html).toContain("Show less");
});
test("unlinking state disables only the selected Knowledge file", () => {
  const html = renderAttachments({ pendingFileId: "example-file-1" });
  const removalButtons = [...html.matchAll(/<button\b[^>]*>/g)]
    .map(([tag]) => tag)
    .filter((tag) => /aria-label="Remove .* from knowledge"/.test(tag));
  expect(
    removalButtons.filter((tag) => tag.includes('disabled=""')),
  ).toHaveLength(1);
  expect(html).toContain("Removing…");
});
test("attachment movement preserves input and submission order in both message galleries", () => {
  const ids = ["a", "b", "c", "d"];
  expect(moveThreadAttachment(ids, "a", -1)).toBe(ids);
  expect(reorderThreadAttachment(ids, "foreign", "b")).toBe(ids);
  const reordered = reorderThreadAttachment(
    moveThreadAttachment(ids, "a", 1),
    "d",
    "b",
  );
  expect(reordered).toEqual(["d", "b", "a", "c"]);
  expect(ids).toEqual(["a", "b", "c", "d"]);
  const files = reordered.map((id) => ({
    id,
    name: `${id}.txt`,
    size: 1,
    text: id,
  }));
  const exchange = appendThreadExchange([], {
    ids: { user: "user", assistant: "proposal" },
    text: "",
    documentName: "Brief.md",
    source: aiChatSourceFixture().source,
    files,
    sourceFiles: [],
    workingOn: "whole",
    agent: knowledgeAgent,
  });
  expect(
    exchange.map((message) => message.files?.map((file) => file.id)),
  ).toEqual([reordered, reordered]);
});
test("new selections reject SVG and executable files before retaining attachments", async () => {
  await expect(
    readProjectFiles(
      [
        new globalThis.File(["notes"], "Notes.md"),
        new globalThis.File(["<svg/>"], "Reference.svg"),
      ],
      "test",
    ),
  ).rejects.toThrow("Unsupported files: Reference.svg");
  await expect(
    readProjectFiles([new globalThis.File(["bytes"], "Program.exe")], "test"),
  ).rejects.toThrow("Allowed formats");
  await expect(
    readProjectFiles(
      [new globalThis.File(["text"], "Image.jpg", { type: "text/plain" })],
      "test",
    ),
  ).rejects.toThrow("Unsupported files: Image.jpg");
  const [file] = await readProjectFiles(
    [new globalThis.File(["notes"], "Notes.md", { type: "text/markdown" })],
    "test",
  );
  expect(file.text).toBe("notes");
  URL.revokeObjectURL(file.fileUrl!);
});
