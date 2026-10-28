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
    variant: "overview-ai-chat",
    title: "Продукты",
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
