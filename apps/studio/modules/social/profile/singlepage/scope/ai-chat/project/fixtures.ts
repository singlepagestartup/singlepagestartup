import {
  attachProjectAsset,
  createProjectProfile,
  prepareProjectDocuments,
  type IProjectProfile,
} from "./state";
import definitions from "./definitions.json";
export function aiChatProjectFixture(): IProjectProfile {
  const project = createProjectProfile("pottery", "Pottery workshops");
  project.notes =
    "Weekend pottery workshops for adults trying pottery for the first time. A small group makes a cup by hand.";
  return {
    ...prepareProjectDocuments(
      project,
      Object.values(definitions).filter((item) => item.id !== "product"),
    ),
    stage: "documents" as const,
  };
}

export function aiChatWorkspaceFixture() {
  const project = {
    id: "pottery",
    name: "Pottery workshops",
    variant: "scope-ai-chat-project" as const,
  };
  return {
    initialProjects: [project],
  };
}

/** A standalone Source example with two original Files and existing analyzed content. */
export function aiChatProjectSourceFixture(): IProjectProfile {
  const project = aiChatProjectFixture();
  const files = [
    {
      id: "workshop-notes",
      name: "Workshop notes.txt",
      text: "Six places per weekend workshop.",
    },
    {
      id: "audience-notes",
      name: "Audience notes.txt",
      text: "Adults trying pottery for the first time.",
    },
  ].map((file) => ({
    ...file,
    size: new TextEncoder().encode(file.text).length,
    mimeType: "text/plain",
    fileUrl: `data:text/plain;charset=utf-8,${encodeURIComponent(file.text)}`,
  }));
  project.sources = files;
  const document = project.documents[0];
  const section = document.sections[0].title;
  project.documents[0] = files.reduce(
    (document, file) =>
      attachProjectAsset(document, file, section, `${file.id}:asset`),
    document,
  );
  project.documents[0].values[section] =
    "## Контекст пользователя\n<!-- knowledge:user -->\nPottery workshops\n<!-- /knowledge:user -->\n\n## Сведения из материалов\nSix places per weekend workshop.\n\n## Общее описание\nSmall-group workshops for first-time potters.";
  return project;
}

export function aiChatSourceFixture() {
  const source = {
    id: "pottery:products:products",
    slug: "pottery:products:products",
    variant: "id-ai-chat",
    title: "Products",
    content: "Weekend pottery workshops for first-time potters.",
    description:
      "Describe the products, their customers, value and current availability.",
  };
  const files = [
    {
      id: "workshop-notes",
      name: "Workshop notes.txt",
      text: "Six places per weekend workshop.",
    },
    {
      id: "audience-notes",
      name: "Audience notes.txt",
      text: "Adults trying pottery for the first time.",
    },
  ].map((file) => ({
    ...file,
    size: new TextEncoder().encode(file.text).length,
    mimeType: "text/plain",
    fileUrl: `data:text/plain;charset=utf-8,${encodeURIComponent(file.text)}`,
  }));
  return {
    source,
    files,
    fileIds: files.map((file) => file.id),
  };
}

/** Fictional files use Studio-owned images and never fetch a user's project. */
export function aiChatAttachmentFixture(count = 13) {
  const names = [
    "Workshop reference.jpg",
    "Workshop sketch.jpg",
    "Project reference.jpg",
    "Audience notes.md",
  ];
  const images = [
    "singlepagestartup-photography-project-start-v1-square.png",
    "singlepagestartup-photography-project-progress-v1-square.png",
    "singlepagestartup-photography-solo-founder-v1-square.png",
  ];
  return Array.from({ length: count }, (_, index) => ({
    id: `example-file-${index + 1}`,
    name:
      index < names.length
        ? names[index]
        : `Workshop reference ${index + 1}.jpg`,
    text: index === 3 ? "Six places per workshop. Materials are included." : "",
    size: (index === 3 ? 1 : 342 - index * 21) * 1024,
    mimeType: index === 3 ? "text/markdown" : "image/jpeg",
    fileUrl:
      index === 3
        ? "data:text/markdown,Six%20places%20per%20workshop."
        : `/module-assets/images/singlepage/generated/living-focus/${images[index % images.length]}`,
  }));
}

export function aiChatAttachmentWorkspaceFixture() {
  const sourceFiles = aiChatAttachmentFixture(13);
  const draftFiles = aiChatAttachmentFixture(4).map((file) => ({
    ...file,
    id: `draft-${file.id}`,
  }));
  return {
    source: {
      ...aiChatSourceFixture().source,
      content:
        "# Pottery workshops\n\nWeekend workshops for adults trying pottery for the first time. Six places per class. Materials are included.",
    },
    files: [...sourceFiles, ...draftFiles],
    sourceFileIds: sourceFiles.map((file) => file.id),
    draftFileIds: draftFiles.map((file) => file.id),
    messages: [
      {
        id: "review-request",
        role: "user" as const,
        text: "Check the current workshop description and the supplied references.",
      },
    ],
  };
}
