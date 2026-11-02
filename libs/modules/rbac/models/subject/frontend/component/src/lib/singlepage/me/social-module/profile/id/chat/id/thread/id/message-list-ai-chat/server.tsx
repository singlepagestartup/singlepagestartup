"use server";
import "server-only";
import { api as subjectApi } from "@sps/rbac/models/subject/sdk/server";
import { Component as ChildComponent } from "./Component";
import type { IComponentProps } from "./interface";
export default async function Server(props: IComponentProps) {
  try {
    const data =
      await subjectApi.socialModuleProfileFindByIdChatFindByIdThreadFindByIdMessageFind(
        {
          id: props.data.id,
          socialModuleProfileId: props.project.requesterProfileId,
          socialModuleChatId: props.project.chat.id,
          socialModuleThreadId: props.thread.id,
          options: props.apiProps?.options,
        },
      );
    return (
      <ChildComponent
        {...props}
        messagesRead={{ data, isPending: false, isError: false }}
      />
    );
  } catch (error) {
    return (
      <ChildComponent
        {...props}
        messagesRead={{
          isPending: false,
          isError: true,
          error: {
            message:
              error instanceof Error
                ? error.message
                : "Data could not be loaded.",
          },
        }}
      />
    );
  }
}
