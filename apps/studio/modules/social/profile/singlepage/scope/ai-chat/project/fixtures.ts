import {
  attachProjectAsset,
  createProjectProfile,
  prepareProjectDocuments,
  type IProjectProfile,
} from "./state";
import definitions from "./definitions.json";
export function aiChatProjectFixture(): IProjectProfile {
  const project = createProjectProfile("pottery", "Мастерская керамики");
  project.notes =
    "Мастер-классы по выходным для взрослых, которые впервые пробуют керамику. Участники небольшой группы лепят чашку вручную.";
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
    name: "Мастерская керамики",
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
      name: "Заметки о мастерской.txt",
      text: "На каждом мастер-классе в выходные — шесть мест.",
    },
    {
      id: "audience-notes",
      name: "Заметки об аудитории.txt",
      text: "Взрослые, которые впервые пробуют керамику.",
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
    content: "Мастер-классы по керамике для начинающих по выходным.",
    description:
      "Опишите продукты, их клиентов, предложение и текущую доступность.",
  };
  const files = [
    {
      id: "workshop-notes",
      name: "Заметки о мастерской.txt",
      text: "На каждом мастер-классе в выходные — шесть мест.",
    },
    {
      id: "audience-notes",
      name: "Заметки об аудитории.txt",
      text: "Взрослые, которые впервые пробуют керамику.",
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
    "Референс мастерской.jpg",
    "Эскиз мастерской.jpg",
    "Референс проекта.jpg",
    "Заметки об аудитории.md",
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
    text: index === 3 ? "На мастер-классе шесть мест. Материалы включены." : "",
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
        text: "Проверь описание мастерской и приложенные референсы.",
      },
    ],
  };
}
