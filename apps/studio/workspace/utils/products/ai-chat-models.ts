import { findLocalRelations } from "./ai-chat-relations";
import type {
  IProjectProfile,
  IProjectFile,
  IProjectAsset,
} from "./ai-chat-workspace";

// Local API-shaped records. Production SDKs are connected after Studio review.
export interface IAIChatUserProfile {
  id: string;
  title: string;
  variant: "ai-chat-user";
}
export interface ISubjectProfileRelation {
  id: string;
  subjectId: string;
  socialModuleProfileId: string;
}
export interface IProfileChatRelation {
  id: string;
  profileId: string;
  chatId: string;
}
export interface IAIChatChat {
  id: string;
  title: string;
  variant: "ai-chat-project" | "ai-chat-work";
}
export interface IProjectLinks {
  chats: IAIChatChat[];
  profilesToChats: IProfileChatRelation[];
}
export interface IProfileSourceRelation {
  id: string;
  profileId: string;
  knowledgeModuleSourceId: string;
}
export interface IAIChatSource {
  id: string;
  slug: string;
  variant: string;
  title: string;
  content: string;
  description?: string | null;
}
export interface IAIChatFile {
  id: string;
  file: string;
  alt?: string | null;
  adminTitle?: string;
  size?: number | null;
  mimeType?: string | null;
}
export interface ISourceFileRelation {
  id: string;
  sourceId: string;
  fileStorageModuleFileId: string;
  orderIndex: number;
}
// Bundle membership is a Studio view parameter, not a Source schema field.
export interface ISourceBundle {
  id: string;
  sourceIds: string[];
  sourceSlugs: string[];
}
export interface ISourceAttachmentView extends Pick<IProjectAsset, "id"> {
  relationId: string;
  deliveryFileId?: string;
}
export interface IProjectKnowledge {
  sources: IAIChatSource[];
  relations: IProfileSourceRelation[];
  bundles: ISourceBundle[];
  files: IAIChatFile[];
  sourceFiles: ISourceFileRelation[];
  attachmentViews: ISourceAttachmentView[];
}
export { findLocalRelations, type ILocalFindProps } from "./ai-chat-relations";

export function linkProjectProfile(
  data: IProjectLinks,
  userProfileId: string,
  project: Pick<IProjectProfile, "id" | "name">,
): IProjectLinks {
  const chatId = `${project.id}:project-chat`;
  return {
    chats: [
      ...data.chats,
      { id: chatId, title: project.name, variant: "ai-chat-project" },
    ],
    profilesToChats: [
      ...data.profilesToChats,
      { id: `${chatId}:user`, profileId: userProfileId, chatId },
      { id: `${chatId}:project`, profileId: project.id, chatId },
    ],
  };
}

export function projectProfilesForUser<
  T extends Pick<IProjectProfile, "id" | "name" | "variant">,
>(userProfileId: string, projects: T[], links: IProjectLinks): T[] {
  const userLinks = findLocalRelations({
    variant: "find",
    data: links.profilesToChats,
    apiProps: {
      params: {
        filters: {
          and: [{ column: "profileId", method: "eq", value: userProfileId }],
        },
      },
    },
  });
  const chatIds = new Set(userLinks.map((link) => link.chatId));
  const projectChatIds = new Set(
    links.chats
      .filter(
        (chat) => chatIds.has(chat.id) && chat.variant === "ai-chat-project",
      )
      .map((chat) => chat.id),
  );
  const profileIds = new Set(
    links.profilesToChats
      .filter((link) => projectChatIds.has(link.chatId))
      .map((link) => link.profileId),
  );
  return projects.filter(
    (profile) =>
      profile.variant === "ai-chat-project" && profileIds.has(profile.id),
  );
}

export function projectProfileIdFromHref(href?: string): string | undefined {
  const id = href
    ?.split(/[?#]/)[0]
    .match(/^\/ai-chat\/projects\/([^/]+)$/)?.[1];
  if (!id || id === "new") return undefined;
  try {
    return decodeURIComponent(id);
  } catch {
    return id;
  }
}

export function projectKnowledge(project: IProjectProfile): IProjectKnowledge {
  const sourceId = (documentId: string, title: string) =>
    `${project.id}:${documentId}:${title}`;
  const sources = project.documents.flatMap((document) =>
    document.sections.map((section) => ({
      id: sourceId(document.id, section.title),
      slug: projectSourceSlug(project.id, document.id, section.title),
      variant: "ai-chat-card" as const,
      title: section.title,
      content: document.values[section.title] ?? "",
      description: section.prompt,
    })),
  );
  const files = new Map<string, IAIChatFile>();
  const sourceFiles = new Map<string, ISourceFileRelation>();
  const attachmentViews: ISourceAttachmentView[] = [];
  const addFile = (file: IProjectFile) =>
    files.set(file.id, {
      id: file.id,
      file: file.fileUrl ?? "",
      alt: file.name,
      size: file.size,
      mimeType: file.mimeType,
    });
  project.sources.forEach(addFile);
  for (const document of project.documents) {
    for (const section of document.sections) {
      const id = sourceId(document.id, section.title);
      let orderIndex = 0;
      for (const asset of (document.assets ?? []).filter(
        (asset) => asset.section === section.title,
      )) {
        const relationId = `${id}:file:${asset.file.id}`;
        addFile(asset.file);
        if (sourceFiles.has(relationId)) continue;
        sourceFiles.set(relationId, {
          id: relationId,
          sourceId: id,
          fileStorageModuleFileId: asset.file.id,
          orderIndex: orderIndex++,
        });
        const { delivery } = asset;
        attachmentViews.push({
          id: asset.id,
          relationId,
          deliveryFileId: delivery?.id,
        });
        if (delivery) {
          addFile(delivery);
          const deliveryId = `${id}:file:${delivery.id}`;
          if (!sourceFiles.has(deliveryId))
            sourceFiles.set(deliveryId, {
              id: deliveryId,
              sourceId: id,
              fileStorageModuleFileId: delivery.id,
              orderIndex: orderIndex++,
            });
        }
      }
    }
  }
  return {
    sources,
    files: [...files.values()],
    sourceFiles: [...sourceFiles.values()],
    attachmentViews,
    bundles: project.documents.map((document) => ({
      id: document.id,
      sourceIds: document.sections.map((section) =>
        sourceId(document.id, section.title),
      ),
      sourceSlugs: document.sections.map((section) =>
        projectSourceSlug(project.id, document.id, section.title),
      ),
    })),
    relations: sources.map((source) => ({
      id: `${source.id}:profile`,
      profileId: project.id,
      knowledgeModuleSourceId: source.id,
    })),
  };
}

export function projectSourceSlug(
  profileId: string,
  documentId: string,
  title: string,
): string {
  const section = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${encodeURIComponent(profileId)}:${encodeURIComponent(documentId)}:${section}`;
}
