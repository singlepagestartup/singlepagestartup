"use client";
import type {
  IComponentProps,
  ISubjectKnowledgeDocumentProps,
} from "./interface";
export type { ISubjectKnowledgeDocumentProps } from "./interface";

import { Component as SocialModuleProfile } from "../../../../../../../../../../../../../../../../social/profile";
import { useThread } from "../../../../../../../../../../../../../../../../social/thread/singlepage/id/ai-chat/Thread";
import { useStudioAccount } from "../../../../../../../../../../../../account/Account";

export function Component({
  variant = "me-social-module-profile-id-chat-id-thread-id-knowledge-module-source-list-document-ai-chat",
  subjectId,
  profileId,
  chatId,
  threadId,
}: IComponentProps) {
  const { account } = useStudioAccount();
  const { thread, workingOn, discuss } = useThread();
  if (thread.id !== threadId)
    return (
      <div
        role="status"
        data-module="rbac"
        data-model="subject"
        data-variant={variant}
      >
        Thread knowledge unavailable.
      </div>
    );
  return (
    <div
      data-module="rbac"
      data-model="subject"
      data-variant={variant}
      data-subject-id={subjectId ?? account.subject?.id}
      data-profile-id={profileId}
      data-chat-id={chatId}
      data-thread-id={threadId}
    >
      <SocialModuleProfile
        variant="knowledge-module-source-list-document-ai-chat"
        discussing={workingOn === "source"}
        onDiscuss={discuss}
      />
    </div>
  );
}
