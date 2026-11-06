"use client";
import "client-only";
import { api as subjectApi } from "@sps/rbac/models/subject/sdk/client";
import { Component as ChildComponent } from "./Component";
import type { IComponentProps } from "./interface";

export default function Client(props: IComponentProps) {
  const threads = subjectApi.socialModuleChatFindByIdThreadFind({
    options: props.apiProps?.options,
    id: props.data.id,
    socialModuleChatId: props.project?.chat.id || "",
    reactQueryOptions: { enabled: !!props.project },
  });
  return (
    <ChildComponent
      {...props}
      threads={threads.data}
      threadsLoading={!!props.project && threads.isPending}
      threadsError={threads.error?.message}
      retryThreads={() => {
        void threads.refetch();
      }}
    />
  );
}
