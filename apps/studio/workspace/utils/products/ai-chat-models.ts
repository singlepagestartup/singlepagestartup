import type { IProjectProfile } from "./ai-chat-workspace";

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
  title: string;
  content: string;
  documentId: string;
}
export interface ILocalFindProps<T> {
  variant: "find";
  data: T[];
  apiProps: {
    params: {
      filters: {
        and: {
          column: keyof T;
          method: "eq" | "in";
          value: string | string[];
        }[];
      };
    };
  };
}

export function findLocalRelations<T>(props: ILocalFindProps<T>): T[] {
  // An empty filter must not expose records from other profiles or subjects.
  const filters = props.apiProps.params.filters.and;
  if (!filters.length) return [];
  return props.data.filter((record) =>
    filters.every(({ column, method, value }) =>
      method === "in"
        ? Array.isArray(value) && value.includes(String(record[column]))
        : record[column] === value,
    ),
  );
}

export function linkProjectProfile(
  data: IProjectLinks,
  userProfileId: string,
  project: IProjectProfile,
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

export function projectProfilesForUser(
  userProfileId: string,
  projects: IProjectProfile[],
  links: IProjectLinks,
): IProjectProfile[] {
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

export function projectKnowledge(project: IProjectProfile): {
  sources: IAIChatSource[];
  relations: IProfileSourceRelation[];
} {
  const sources = project.documents.flatMap((document) =>
    document.sections.map((section) => ({
      id: `${project.id}:${document.id}:${section.title}`,
      title: section.title,
      content: document.values[section.title] ?? "",
      documentId: document.id,
    })),
  );
  return {
    sources,
    relations: sources.map((source) => ({
      id: `${source.id}:profile`,
      profileId: project.id,
      knowledgeModuleSourceId: source.id,
    })),
  };
}

export function projectWorkChats(project: IProjectProfile): IProjectLinks {
  return {
    chats: project.topics.map((topic) => ({
      id: topic.id,
      title: topic.title,
      variant: "ai-chat-work",
    })),
    profilesToChats: project.topics.map((topic) => ({
      id: `${project.id}:${topic.id}`,
      profileId: project.id,
      chatId: topic.id,
    })),
  };
}
