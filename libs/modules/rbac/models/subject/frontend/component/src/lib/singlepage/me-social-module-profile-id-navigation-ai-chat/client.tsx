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
  if (threads.isPending) return props.skeleton ?? <Skeleton />;
  return (
    <ChildComponent
      {...props}
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
