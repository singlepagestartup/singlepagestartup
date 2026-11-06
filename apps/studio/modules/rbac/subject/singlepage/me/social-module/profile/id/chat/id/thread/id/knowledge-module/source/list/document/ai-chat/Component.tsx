"use client";
import type {
  IComponentProps,
  ISubjectKnowledgeDocumentProps,
} from "./interface";
export type { ISubjectKnowledgeDocumentProps } from "./interface";

import { Component as SocialModuleProfile } from "../../../../../../../../../../../../../../../../social/profile";
import { useThread } from "../../../../../../../../../../../../../../../../social/thread/singlepage/id/ai-chat/Thread";
import { useStudioAccount } from "../../../../../../../../../../../../account/Account";
import { useSource } from "../../../../../../../../../../../../../../../../knowledge/source/singlepage/id/ai-chat/Source";
import {
  sourceMaterials,
  sourceUserContext,
} from "../../../../../../../../../../../../../../../../knowledge/source";
import { DevelopmentHandoff } from "./DevelopmentHandoff";

export function Component({
  variant = "me-social-module-profile-id-chat-id-thread-id-knowledge-module-source-list-document-ai-chat",
  subjectId,
  profileId,
  chatId,
  threadId,
}: IComponentProps) {
  const { account } = useStudioAccount();
  const { thread, workingOn, discuss, proposal } = useThread();
  const { source } = useSource();
  const handoffRevision = JSON.stringify([
    subjectId ?? account.subject?.id,
    profileId,
    chatId,
    thread.id,
    thread.title,
    source.id,
    source.title,
    source.content,
    proposal,
  ]);
  if (thread.id !== threadId)
    return (
      <div
        role="status"
        data-module="rbac"
        data-model="subject"
        data-variant={variant}
      >
        Знания обсуждения недоступны.
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
      <DevelopmentHandoff
        key={handoffRevision}
        fileName={
          /\.md$/i.test(thread.title) ? thread.title : `${thread.title}.md`
        }
        revision={handoffRevision}
        hasContent={Boolean(
          sourceUserContext(source.content).trim() ||
            sourceMaterials(source.content).trim(),
        )}
        hasPendingProposal={Boolean(proposal)}
      />
    </div>
  );
}
