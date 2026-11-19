"use client";
import { Skeleton } from "./Skeleton";
import "client-only";
import { Component as ChildComponent } from "./Component";
import type { IComponentProps } from "./interface";
import { useThreadMessages } from "../../../../../../../../../social-module/profile/chat/message/list/default/hooks/use-thread-messages";
export default function Client(props: IComponentProps) {
  const messages = useThreadMessages(
    {
      subjectId: props.data.id,
      socialModuleProfileId: props.project.requesterProfileId,
      socialModuleChatId: props.project.chat.id,
      socialModuleThreadId: props.thread.id,
    },
    false,
    { options: props.apiProps?.options },
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
