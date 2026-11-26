"use client";
import { Skeleton } from "./Skeleton";
import "client-only";
import { api as subjectApi } from "@sps/rbac/models/subject/sdk/client";
import { Component as ChildComponent } from "./Component";
import type { IComponentProps } from "./interface";
export default function Client(props: IComponentProps) {
  const project = props.project;
  const threads = subjectApi.socialModuleChatFindByIdThreadFind({
    options: props.apiProps?.options,
    id: props.data.id,
    socialModuleChatId: project.chat.id,
  });
  const chat = subjectApi.socialModuleProfileFindByIdChatFindById({
    id: props.data.id,
    socialModuleProfileId: project.requesterProfileId,
    socialModuleChatId: project.chat.id,
    options: props.apiProps?.options,
  });
  if (threads.isPending)
    return props.skeleton ?? <Skeleton language={props.language} />;
  return (
    <ChildComponent
      {...props}
      canManageChat={!chat.isError && chat.data?.canManageChat === true}
      threadsRead={{
        data: threads.data,
        isPending: threads.isPending,
        isFetching: threads.isFetching,
        isError: threads.isError,
        error: threads.error ? { message: threads.error.message } : undefined,
        refetch: () => {
          void threads.refetch();
        },
      }}
    />
  );
}
