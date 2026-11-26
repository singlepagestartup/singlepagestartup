import type { IModel as IProfile } from "@sps/social/models/profile/sdk/model";
import type { IModel as IChat } from "@sps/social/models/chat/sdk/model";
import type { IModel as IThread } from "@sps/social/models/thread/sdk/model";
export interface IAIChatProject {
  profile: IProfile;
  chat: IChat;
  thread: IThread;
  requesterProfileId: string;
}
export function projectHref(
  project: IAIChatProject,
  threadId = project.thread.id,
) {
  return `/social/chats/${project.chat.id}/threads/${threadId}`;
}

export function projectBaseHref(project: IAIChatProject) {
  return `/ai-chat/social/profiles/${project.profile.id}/chats/${project.chat.id}`;
}
