"use client";
import { Skeleton } from "./Skeleton";
import "client-only";
import { api as subjectApi } from "@sps/rbac/models/subject/sdk/client";
import { Component as ChildComponent } from "./Component";
import type { IComponentProps } from "./interface";
export default function Client(props: IComponentProps) {
  const messages =
    subjectApi.socialModuleProfileFindByIdChatFindByIdThreadFindByIdMessageFind(
      {
        options: props.apiProps?.options,
        id: props.data.id,
        socialModuleProfileId: props.project.requesterProfileId,
        socialModuleChatId: props.project.chat.id,
        socialModuleThreadId: props.thread.id,
      },
    );
  if (messages.isPending)
    return props.skeleton ?? <Skeleton language={props.language} />;
  return (
    <ChildComponent
      {...props}
      messagesRead={{
        data: messages.data,
        isPending: messages.isPending,
        isFetching: messages.isFetching,
        isError: messages.isError,
        error: messages.error ? { message: messages.error.message } : undefined,
        refetch: () => {
          void messages.refetch();
        },
      }}
    />
  );
}
