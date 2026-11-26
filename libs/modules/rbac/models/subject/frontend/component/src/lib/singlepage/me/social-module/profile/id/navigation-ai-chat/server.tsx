"use server";
import "server-only";
import { api as subjectApi } from "@sps/rbac/models/subject/sdk/server";
import { Component as ChildComponent } from "./Component";
import type { IComponentProps } from "./interface";
export default async function Server(props: IComponentProps) {
  const project = props.project;
  try {
    const chatScope = {
      id: props.data.id,
      socialModuleChatId: project.chat.id,
      options: props.apiProps?.options,
    };
    const [data, chat] = await Promise.all([
      subjectApi.socialModuleChatFindByIdThreadFind(chatScope),
      subjectApi
        .socialModuleProfileFindByIdChatFindById({
          ...chatScope,
          socialModuleProfileId: project.requesterProfileId,
        })
        .catch(() => null),
    ]);
    return (
      <ChildComponent
        {...props}
        canManageChat={chat?.canManageChat === true}
        threadsRead={{ data, isPending: false, isError: false }}
      />
    );
  } catch (error) {
    return (
      <ChildComponent
        {...props}
        canManageChat={false}
        threadsRead={{
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
