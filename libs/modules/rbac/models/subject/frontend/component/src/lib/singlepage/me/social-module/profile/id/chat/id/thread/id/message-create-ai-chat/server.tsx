"use server";
import "server-only";
import { api as subjectApi } from "@sps/rbac/models/subject/sdk/server";
import { getAIChatDocument } from "@sps/rbac/models/subject/sdk/model";
import { Component as ChildComponent } from "./Component";
import type { IComponentProps } from "./interface";
export default async function Server(props: IComponentProps) {
  const project = props.project;
  const scope = {
    options: props.apiProps?.options,
    id: props.data.id,
    socialModuleProfileId: project.requesterProfileId,
    socialModuleChatId: project.chat.id,
    targetSocialModuleProfileId: project.profile.id,
  };
  const document = getAIChatDocument(props.thread.metadata);
  const isDocument = document?.profileId === project.profile.id;
  try {
    const data = !isDocument
      ? []
      : await subjectApi.socialModuleProfileFindByIdChatFindByIdProfileFindByIdKnowledgeSourceFind(
          { ...scope },
        );
    return (
      <ChildComponent
        {...props}
        sourcesRead={{ data, isPending: false, isError: false }}
      />
    );
  } catch (error) {
    return (
      <ChildComponent
        {...props}
        sourcesRead={{
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
