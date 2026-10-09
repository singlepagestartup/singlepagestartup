import { linkProjectProfile } from "./ai-chat-models";
import { aiChatAccount } from "./ai-chat-account-fixture";
import {
  attachProjectAsset,
  createProjectProfile,
  prepareProjectDocuments,
  type IProjectProfile,
} from "./ai-chat-workspace";
import definitions from "../../../modules/social/models/profile/singlepage/ai-chat-project/definitions.json";
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
    variant: "ai-chat-project" as const,
  };
  return {
    initialProjects: [project],
    initialLinks: linkProjectProfile(
      { chats: [], profilesToChats: [] },
      aiChatAccount.profiles[0].id,
      project,
    ),
  };
}

/** A standalone Source example with two original Files and existing analyzed content. */
export function aiChatSourceFixture(): IProjectProfile {
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

export function aiChatProductsSourceFixture() {
  const source = {
    id: "pottery:products:products",
    slug: "pottery:products:products",
    variant: "ai-chat-card",
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
    links: files.map((file, orderIndex) => ({
      id: `${source.id}:file:${file.id}`,
      sourceId: source.id,
      fileStorageModuleFileId: file.id,
      orderIndex,
    })),
  };
}
