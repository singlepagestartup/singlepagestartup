"use client";
import { getAIChatDocument } from "@sps/rbac/models/subject/sdk/model";
import { AI_CHAT_DOCUMENTS } from "@sps/shared-utils";
import { Component as SocialModuleProfile } from "@sps/social/models/profile/frontend/component";
import { Component as SocialModuleThread } from "@sps/social/models/thread/frontend/component";
import {
  projectHref,
  projectBaseHref,
} from "@sps/rbac/models/subject/sdk/model";
import type { IComponentPropsExtended } from "./interface";
export function Component(props: IComponentPropsExtended) {
  const project = props.project;
  const threads = {
    ...props.threadsRead,
    refetch: props.threadsRead.refetch || (() => window.location.reload()),
  };
  const documents = AI_CHAT_DOCUMENTS.flatMap((definition) =>
    (threads.data || []).filter((thread) => {
      const document = getAIChatDocument(thread.metadata);
      return (
        document?.profileId === project.profile.id &&
        document.key === definition.key
      );
    }),
  );
  return (
    <SocialModuleProfile
      isServer={false}
      variant="sidebar-ai-chat-project"
      language={props.language}
      data={project.profile}
      dataSource="props"
      settingsHref={`${projectBaseHref(project)}/settings`}
      newThreadHref={`${projectBaseHref(project)}/threads/create`}
      settingsSelected={props.selected === "settings"}
      creatingThread={props.selected === "create"}
      threads={
        <>
          {threads.data
            ?.filter((thread) => !getAIChatDocument(thread.metadata))
            .map((thread) => (
              <SocialModuleThread
                key={thread.id}
                isServer={false}
                variant="list-item-sidebar-ai-chat"
                language={props.language}
                data={thread}
                dataSource="props"
                href={projectHref(project, thread.id)}
                selected={thread.id === props.threadId}
                topic
              />
            ))}
        </>
      }
    >
      <SocialModuleProfile
        isServer={false}
        variant="thread-list-sidebar-ai-chat"
        language={props.language}
        data={project.profile}
        dataSource="props"
        className="my-4"
        documents={documents.map((thread) => ({
          data: thread,
          dataSource: "props",
          href: projectHref(project, thread.id),
          selected: thread.id === (props.threadId || project.thread.id),
        }))}
      />
    </SocialModuleProfile>
  );
}
