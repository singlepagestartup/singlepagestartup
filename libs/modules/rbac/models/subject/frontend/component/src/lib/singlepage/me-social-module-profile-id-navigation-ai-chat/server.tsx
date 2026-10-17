"use server";
import "server-only";
import { api as subjectApi } from "@sps/rbac/models/subject/sdk/server";
import { Component as ChildComponent } from "./Component";
import type { IComponentProps } from "./interface";
export default async function Server(props: IComponentProps) {
  const project = props.project;
  try {
    const data = await subjectApi.socialModuleChatFindByIdThreadFind({
      id: props.data.id,
      socialModuleChatId: project.chat.id,
      options: props.apiProps?.options,
    });
    return (
      <ChildComponent
        {...props}
        threadsRead={{ data, isPending: false, isError: false }}
      />
    );
  } catch (error) {
    return (
      <ChildComponent
        {...props}
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
