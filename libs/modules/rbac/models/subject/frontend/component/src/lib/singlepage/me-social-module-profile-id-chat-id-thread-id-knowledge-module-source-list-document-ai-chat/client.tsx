"use client";
import { Skeleton } from "./Skeleton";
import "client-only";
import { api as subjectApi } from "@sps/rbac/models/subject/sdk/client";
import { Component as ChildComponent } from "./Component";
import type { IComponentProps } from "./interface";
export default function Client(props: IComponentProps) {
  const project = props.project;
  const scope = {
    options: props.apiProps?.options,
    id: props.data.id,
    socialModuleProfileId: project.requesterProfileId,
    socialModuleChatId: project.chat.id,
    targetSocialModuleProfileId: project.profile.id,
  };
  const sources =
    subjectApi.socialModuleProfileFindByIdChatFindByIdProfileFindByIdKnowledgeSourceFind(
      scope,
    );
  if (sources.isPending) return props.skeleton ?? <Skeleton />;
  return (
    <ChildComponent
      {...props}
      sourcesRead={{
        data: sources.data,
        isPending: sources.isPending,
        isFetching: sources.isFetching,
        isError: sources.isError,
        error: sources.error ? { message: sources.error.message } : undefined,
        refetch: () => {
          void sources.refetch();
        },
      }}
    />
  );
}
