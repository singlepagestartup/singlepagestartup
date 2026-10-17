"use client";
import { Skeleton } from "./Skeleton";
import "client-only";
import { api as subjectApi } from "@sps/rbac/models/subject/sdk/client";
import { Component as ChildComponent } from "./Component";
import type { IComponentProps } from "./interface";
export default function Client(props: IComponentProps) {
  const { data, project, source } = props;
  const scope = {
    options: props.apiProps?.options,
    id: data.id,
    socialModuleProfileId: project.requesterProfileId,
    socialModuleChatId: project.chat.id,
    targetSocialModuleProfileId: project.profile.id,
  };
  const attachments =
    subjectApi.socialModuleProfileFindByIdChatFindByIdProfileFindByIdKnowledgeSourceFindByIdFilesFind(
      { ...scope, knowledgeModuleSourceId: source.id },
    );
  if (attachments.isPending) return props.skeleton ?? <Skeleton />;
  return (
    <ChildComponent
      {...props}
      attachmentsRead={{
        data: attachments.data,
        isPending: attachments.isPending,
        isFetching: attachments.isFetching,
        isError: attachments.isError,
        error: attachments.error
          ? { message: attachments.error.message }
          : undefined,
        refetch: () => {
          void attachments.refetch();
        },
      }}
    />
  );
}
