"use client";
import {
  projectHref,
  projectBaseHref,
} from "@sps/rbac/models/subject/sdk/model";
import { Component as SocialModuleProfile } from "@sps/social/models/profile/frontend/component";
import { Component as SocialModuleThread } from "@sps/social/models/thread/frontend/component";

import type { IComponentPropsExtended } from "./interface";
export function Component(props: IComponentPropsExtended) {
  const project = props.project;
  return (
    <SocialModuleProfile
      isServer={false}
      variant="sidebar-ai-chat-project"
      language={props.language}
      data={project.profile}
      dataSource="props"
      settingsHref={`${projectBaseHref(project)}/settings`}
      newThreadHref={
        props.canManageChat
          ? `${projectBaseHref(project)}/threads/create`
          : undefined
      }
      settingsSelected={props.selected === "settings"}
      creatingThread={props.selected === "create"}
      threads={
        <>
          {props.threadsRead.data?.map((thread) => (
            <SocialModuleThread
              key={thread.id}
              isServer={false}
              variant="list-item-sidebar-ai-chat"
              language={props.language}
              data={thread}
              dataSource="props"
              href={projectHref(project, thread.id)}
              selected={thread.id === props.socialModuleThreadId}
              topic
            />
          ))}
        </>
      }
    />
  );
}
