"use client";
import "client-only";

import { api } from "@sps/rbac/models/subject/sdk/client";
import { getAIChatDocument } from "@sps/rbac/models/subject/sdk/model";
import { Component as ChildComponent } from "./Component";
import { IComponentProps } from "./interface";

/**
 * The message/action queries intentionally do NOT live here (issue #195):
 * they are owned by MessageTimelineSection inside the chat shell, so cache
 * appends and refetches rerender only the timeline boundary instead of the
 * whole chat page.
 */
export default function Component(props: IComponentProps) {
  const document =
    props.socialModuleChat.variant === "ai-chat" &&
    props.socialModuleThreadId === props.socialModuleThread.id
      ? getAIChatDocument(props.socialModuleThread.metadata)
      : null;
  const projects = api.socialModuleProfileProjects({
    id: props.data.id,
    reactQueryOptions: { enabled: Boolean(document) },
  });
  const status = (projects.error as (Error & { status?: number }) | null)
    ?.status;
  const documentProject =
    document && status !== 401 && status !== 403
      ? projects.data?.find(
          (project) =>
            project.chat.id === props.socialModuleChat.id &&
            project.requesterProfileId === props.socialModuleProfile.id &&
            project.profile.id === document.profileId,
        )
      : undefined;

  return <ChildComponent {...props} documentProject={documentProject} />;
}
