import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { type IProjectFile } from "./ai-chat-workspace";
import {
  editSourceUserContext,
  sourceMaterials,
  sourceUserContext,
} from "./ai-chat-knowledge";
import { SourceProvider } from "../../../modules/knowledge/source/singlepage/overview/document/ai-chat/Source";
import { FilesProvider } from "../../../modules/file-storage/file/singlepage/list/attachments/ai-chat/Files";
import { Component as SourceSection } from "../../../modules/knowledge/source/singlepage/overview/ai-chat/index";

const files: IProjectFile[] = [
  {
    id: "a",
    name: "Workshop notes.txt",
    text: "Six places per workshop.",
    size: 24,
    mimeType: "text/plain",
    fileUrl: "/notes.txt",
  },
  {
    id: "b",
    name: "Audience.txt",
    text: "First-time potters.",
    size: 18,
    mimeType: "text/plain",
    fileUrl: "/audience.txt",
  },
];
test("user-context edits preserve file-derived content exactly", () => {
  const original =
    "## Контекст пользователя\n<!-- knowledge:user -->\nПервые занятия.\n<!-- /knowledge:user -->\n\n## Сведения из материалов\nШесть мест.\n\n## Общее описание\nКерамика.";
  const changed = editSourceUserContext(original, "Новые заметки 🙂");
  expect(sourceUserContext(changed)).toBe("Новые заметки 🙂");
  expect(sourceMaterials(changed)).toBe(sourceMaterials(original));
  expect(changed.slice(changed.indexOf("<!-- /knowledge:user -->"))).toBe(
    original.slice(original.indexOf("<!-- /knowledge:user -->")),
  );
  expect(editSourceUserContext("Plain notes", "Revised notes")).toBe(
    "Revised notes",
  );
  expect(sourceUserContext("Plain notes")).toBe("Plain notes");
  expect(sourceMaterials("Plain notes")).toBe("");
});

test("Source variant renders multiple scoped Files and excludes another section's attachment", () => {
  const data = {
    id: "pottery:brief:Project and products",
    slug: "project-and-products",
    variant: "overview-ai-chat",
    title: "Project and products",
    content:
      "## Контекст пользователя\n<!-- knowledge:user -->\nNotes\n<!-- /knowledge:user -->\n\n## Сведения из материалов\nRead-only description",
  };
  const html = renderToStaticMarkup(
    <FilesProvider
      initialFiles={[
        ...files,
        {
          id: "foreign",
          name: "Foreign material.txt",
          text: "Other source",
          size: 10,
          fileUrl: "/foreign.txt",
        },
      ]}
    >
      <SourceProvider
        profileId="pottery"
        initialSource={data}
        initialFileIds={files.map((file) => file.id)}
      >
        <SourceSection />
      </SourceProvider>
    </FilesProvider>,
  );
  expect(html).toContain('data-id="pottery:brief:Project and products"');
  expect(html).toContain("Workshop notes.txt");
  expect(html).toContain("Audience.txt");
  expect(html).toContain("Files · 2");
  expect(html).toContain("Analyzed materials");
  expect(html).toContain("Read-only description");
  expect(html).not.toContain("Foreign material.txt");
  expect(html).not.toContain("Generated files");
  expect(html).not.toContain("References ·");
  expect(html).not.toContain("Approve file");
  expect(html).toContain("Upload files");
});
