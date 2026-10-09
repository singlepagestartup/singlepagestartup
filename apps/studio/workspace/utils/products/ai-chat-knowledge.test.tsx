import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { projectKnowledge, findLocalRelations } from "./ai-chat-models";
import { aiChatProjectFixture } from "./ai-chat-workspace-fixture";
import { attachProjectAsset, type IProjectFile } from "./ai-chat-workspace";
import {
  editSourceUserContext,
  sourceMaterials,
  sourceUserContext,
  sourceAttachmentAssets,
} from "./ai-chat-knowledge";
import { SourceProvider } from "../../../modules/knowledge/models/source/singlepage/ai-chat-document/Source";
import { FilesProvider } from "../../../modules/file-storage/models/file/singlepage/ai-chat-attachments/Files";
import { Component as SourceSection } from "../../../modules/knowledge/models/source/singlepage/ai-chat-card/index";

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
function attachedProject() {
  const project = aiChatProjectFixture();
  project.sources = files;
  const first = project.documents[0].sections[0].title;
  const second = project.documents[0].sections[1].title;
  project.documents[0] = attachProjectAsset(
    project.documents[0],
    files[0],
    first,
    "asset-a",
  );
  project.documents[0] = attachProjectAsset(
    project.documents[0],
    files[1],
    first,
    "asset-b",
  );
  project.documents[0] = attachProjectAsset(
    project.documents[0],
    files[0],
    second,
    "asset-shared",
  );
  return project;
}
test("each section owns ordered unique Source/File links; a File can be shared", () => {
  const project = attachedProject();
  const graph = projectKnowledge(project);
  const source = graph.sources[0];
  const own = graph.sourceFiles.filter((link) => link.sourceId === source.id);
  expect(
    own.map((link) => [link.fileStorageModuleFileId, link.orderIndex]),
  ).toEqual([
    ["a", 0],
    ["b", 1],
  ]);
  expect(
    graph.sourceFiles.filter((link) => link.fileStorageModuleFileId === "a"),
  ).toHaveLength(2);
  expect(graph.files).toHaveLength(2);
  expect(source).not.toHaveProperty("files");
  expect(source).not.toHaveProperty("documentId");
  const document = project.documents[0];
  expect(
    attachProjectAsset(document, files[0], source.title, "duplicate"),
  ).toBe(document);
  const after = projectKnowledge({
    ...project,
    documents: project.documents.map((document, index) =>
      index === 0
        ? {
            ...document,
            assets: document.assets?.filter((asset) => asset.id !== "asset-a"),
          }
        : document,
    ),
  });
  expect(
    after.sourceFiles
      .filter((link) => link.sourceId === source.id)
      .map((link) => link.fileStorageModuleFileId),
  ).toEqual(["b"]);
  expect(after.files).toHaveLength(2);
  expect(
    after.sourceFiles.filter((link) => link.fileStorageModuleFileId === "a"),
  ).toHaveLength(1);
});

test("attachment resolution uses scoped links and preserves original and delivery files", () => {
  const project = attachedProject();
  project.documents[0].assets![0].delivery = {
    ...files[1],
    id: "square",
    name: "Delivery.png",
    fileUrl: "/delivery.png",
    mimeType: "image/png",
  };
  const graph = projectKnowledge(project);
  const scoped = findLocalRelations({
    variant: "find",
    data: graph.sourceFiles,
    apiProps: {
      params: {
        filters: {
          and: [
            { column: "sourceId", method: "eq", value: graph.sources[0].id },
          ],
        },
      },
    },
  });
  const assets = sourceAttachmentAssets(
    graph.sources[0].title,
    [...scoped].reverse(),
    graph.files,
    graph.attachmentViews,
  );
  expect(assets.map((asset) => asset.file.id)).toEqual(["a", "square", "b"]);
  expect(assets[1].file.fileUrl).toBe("/delivery.png");
  expect(
    sourceAttachmentAssets("Missing", [], graph.files, graph.attachmentViews),
  ).toEqual([]);
  const withoutDelivery = scoped.filter(
    (link) => link.fileStorageModuleFileId !== "square",
  );
  expect(
    sourceAttachmentAssets(
      "Section",
      withoutDelivery,
      graph.files,
      graph.attachmentViews,
    )[0].delivery,
  ).toBeUndefined();
  const nullable = sourceAttachmentAssets(
    "Section",
    [
      {
        id: "nullable",
        sourceId: "source",
        fileStorageModuleFileId: "file",
        orderIndex: 0,
      },
    ],
    [
      {
        id: "file",
        file: "/original.txt",
        alt: null,
        size: null,
        mimeType: null,
      },
    ],
    [],
  );
  expect(nullable[0].file.name).toBe("original.txt");
  expect(nullable[0].file.size).toBe(0);
  expect(nullable[0].file.mimeType).toBeUndefined();
});

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
  const project = attachedProject();
  const graph = projectKnowledge(project);
  const data = {
    ...graph.sources[0],
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
        initialFileLinks={[
          ...graph.sourceFiles,
          {
            id: "foreign-link",
            sourceId: "other",
            fileStorageModuleFileId: "foreign",
            orderIndex: 0,
          },
        ]}
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
