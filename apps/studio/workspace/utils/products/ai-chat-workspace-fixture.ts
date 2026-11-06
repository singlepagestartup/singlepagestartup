import {
  attachProjectAsset,
  createProjectProfile,
  prepareProjectDocuments,
  type IProjectProfile,
} from "./ai-chat-workspace";
import definitions from "./ai-chat-document-definitions.json";
export function aiChatProjectFixture(): IProjectProfile {
  const project = createProjectProfile("pottery", "Гончарные мастер-классы");
  project.notes =
    "Гончарные мастер-классы по выходным для взрослых без опыта. Участники небольшой группы лепят чашку вручную.";
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
    name: "Гончарные мастер-классы",
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
      name: "Заметки мастер-класса.txt",
      text: "Шесть мест на каждом мастер-классе выходного дня.",
    },
    {
      id: "audience-notes",
      name: "Заметки об аудитории.txt",
      text: "Взрослые, которые впервые пробуют гончарное дело.",
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
    "## Контекст пользователя\n<!-- knowledge:user -->\nГончарные мастер-классы\n<!-- /knowledge:user -->\n\n## Сведения из материалов\nШесть мест на каждом мастер-классе выходного дня.\n\n## Общее описание\nМастер-классы в небольших группах для начинающих.";
  return project;
}

export function aiChatSourceFixture() {
  const source = {
    id: "pottery:products:products",
    slug: "pottery:products:products",
    variant: "overview-ai-chat",
    title: "Products",
    content: "Гончарные мастер-классы по выходным для начинающих.",
    description: "Опишите продукты, клиентов, ценность и текущую доступность.",
  };
  const files = [
    {
      id: "workshop-notes",
      name: "Заметки мастер-класса.txt",
      text: "Шесть мест на каждом мастер-классе выходного дня.",
    },
    {
      id: "audience-notes",
      name: "Заметки об аудитории.txt",
      text: "Взрослые, которые впервые пробуют гончарное дело.",
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
