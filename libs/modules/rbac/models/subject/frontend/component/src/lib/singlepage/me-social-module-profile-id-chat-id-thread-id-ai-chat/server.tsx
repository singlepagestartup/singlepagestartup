"use server";
import "server-only";
import { api as subjectApi } from "@sps/rbac/models/subject/sdk/server";
import { Component as ChildComponent } from "./Component";
import type { IComponentProps } from "./interface";

export default async function Server(props: IComponentProps) {
  try {
    const threads = props.project
      ? await subjectApi.socialModuleChatFindByIdThreadFind({
          id: props.data.id,
          socialModuleChatId: props.project.chat.id,
          options: props.apiProps?.options,
        })
      : [];
    return (
      <ChildComponent {...props} threads={threads} threadsLoading={false} />
    );
  } catch (error) {
    return (
      <ChildComponent
        {...props}
        threadsLoading={false}
        threadsError={
          error instanceof Error ? error.message : "Thread could not be loaded."
        }
      />
    );
  }
}
