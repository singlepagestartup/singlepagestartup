import type { IModel as IProfile } from "@sps/social/models/profile/sdk/model";
import type { IModel as IChat } from "@sps/social/models/chat/sdk/model";
import type { IModel as IThread } from "@sps/social/models/thread/sdk/model";
import { AI_CHAT_DOCUMENTS, type AIChatDocumentKey } from "@sps/shared-utils";
export interface IAIChatProject {
  profile: IProfile;
  chat: IChat;
  thread: IThread;
  requesterProfileId: string;
}
export interface IAIChatDocument {
  key: AIChatDocumentKey;
  profileId: string;
  sourceIds: string[];
}
export function getAIChatDocument(metadata: unknown): IAIChatDocument | null {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata))
    return null;
  const value = (metadata as Record<string, unknown>).aiChatDocument;
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  if (
    !AI_CHAT_DOCUMENTS.some((definition) => definition.key === record.key) ||
    typeof record.profileId !== "string" ||
    !Array.isArray(record.sourceIds) ||
    !record.sourceIds.every((id) => typeof id === "string")
  )
    return null;
  return {
    key: record.key as AIChatDocumentKey,
    profileId: record.profileId,
    sourceIds: [...new Set(record.sourceIds as string[])],
  };
}

export function projectHref(
  project: IAIChatProject,
  threadId = project.thread.id,
) {
  return `${projectBaseHref(project)}/threads/${threadId}`;
}

export function projectBaseHref(project: IAIChatProject) {
  return `/ai-chat/social/profiles/${project.profile.id}/chats/${project.chat.id}`;
}
