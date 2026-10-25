"use client";
import type {
  IComponentProps,
  ISubjectThreadWorkspaceProps,
} from "./interface";
export type { ISubjectThreadWorkspaceProps } from "./interface";

import { Component as SocialModuleProfile } from "../../../../social/profile";
import { Component as SocialModuleChat } from "../../../../social/chat";
import { Component as SocialModuleThread } from "../../../../social/thread";
import { useStudioAccount } from "../../../subject/singlepage/me/account/Account";
import { useThread } from "../../../../social/thread/singlepage/id/ai-chat/Thread";
import { ProjectProvider } from "../../../../social/profile/singlepage/scope/ai-chat/project/Profile";
import { useSource } from "../../../../knowledge/source/singlepage/id/ai-chat/Source";
import { Component as Subject } from "../../../subject";
import type { ReactNode } from "react";
import {
  Component as WorkspaceSkeleton,
  type IWorkspaceSkeletonProps,
} from "./Skeleton";
import {
  Component as WorkspaceNotice,
  type IWorkspaceNoticeProps,
} from "./Error";

interface IThreadWorkspaceContentProps
  extends Omit<ISubjectThreadWorkspaceProps, "variant"> {
  navigation: ReactNode;
}
function ThreadWorkspaceContent({
  subjectId,
  profileId,
  chatId,
  threadId,
  navigation,
  state,
}: IThreadWorkspaceContentProps) {
  const { source } = useSource();
  const { thread } = useThread();
  const selected = threadId ?? thread.id;
  if (state === "loading-chat")
    return <WorkspaceSkeleton stage="loading-chat" embedded />;
  if (thread.id !== selected)
    return <p role="status">Обсуждение недоступно в этом примере проекта.</p>;
  return (
    <SocialModuleChat
      variant="id-ai-chat"
      chatId={chatId}
      thread={
        <SocialModuleThread
          variant="id-ai-chat"
          navigation={navigation}
          messageCreate={
            <Subject
              variant="me-social-module-profile-id-chat-id-thread-id-message-create-ai-chat"
              subjectId={subjectId}
              profileId={profileId}
              chatId={chatId}
              threadId={selected}
            />
          }
          knowledgeSourceIds={[source.id]}
          documentDownload={
            <SocialModuleThread
              variant="download-ai-chat"
              threadId={selected}
              fileName={thread.title}
              sources={[source]}
            />
          }
          knowledgeUpdate={
            <Subject
              variant="me-social-module-profile-id-chat-id-thread-id-knowledge-module-source-update-ai-chat"
              subjectId={subjectId}
              profileId={profileId}
              chatId={chatId}
              threadId={selected}
            />
          }
          knowledge={
            <>
              <Subject
                variant="me-social-module-profile-id-chat-id-thread-id-knowledge-module-source-list-document-ai-chat"
                subjectId={subjectId}
                profileId={profileId}
                chatId={chatId}
                threadId={selected}
              />
            </>
          }
        />
      }
    />
  );
}
function SubjectThreadWorkspace({
  variant = "subject-me-social-module-profile-id-chat-id-thread-id-ai-chat",
  subjectId,
  profileId,
  chatId,
  threadId,
  state,
  embedded,
}: ISubjectThreadWorkspaceProps) {
  const { account } = useStudioAccount();
  const actor = subjectId ?? account.subject?.id;
  const { thread } = useThread();
  const selected = threadId ?? thread.id;
  return (
    <div
      data-ds-block={`rbac.widget.${variant}`}
      data-module="rbac"
      data-model="widget"
      data-variant={variant}
      data-subject-id={actor}
      data-profile-id={profileId}
      data-chat-id={chatId}
      data-thread-id={selected}
    >
      <SocialModuleProfile
        variant="id-ai-chat-project"
        profileId={profileId}
        chatId={chatId}
        selected="products"
        embedded={embedded}
      >
        {(navigation) => (
          <ThreadWorkspaceContent
            subjectId={actor}
            profileId={profileId}
            chatId={chatId}
            threadId={selected}
            navigation={navigation}
            state={state}
          />
        )}
      </SocialModuleProfile>
    </div>
  );
}

export function Component(props: IComponentProps) {
  const state = props.state ?? "ready";
  if (state === "checking-session" || state === "loading-projects")
    return <WorkspaceSkeleton stage={state} />;
  if (
    state === "sign-in-required" ||
    state === "access-denied" ||
    state === "error"
  )
    return (
      <WorkspaceNotice
        state={state}
        message={props.errorMessage}
        onRetry={props.onRetry}
      />
    );
  return (
    <ProjectProvider profileId={props.profileId}>
      <SubjectThreadWorkspace {...props} />
    </ProjectProvider>
  );
}
