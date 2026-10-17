"use client";
import { Component as Subject } from "@sps/rbac/models/subject/frontend/component";
import {
  Component as SocialModuleProfile,
  EmptyProjectSelect,
} from "@sps/social/models/profile/frontend/component";
import { projectHref } from "@sps/rbac/models/subject/sdk/model";
import type { IComponentPropsExtended } from "./interface";
export function Component(props: IComponentPropsExtended) {
  const locale = props.language || "en";
  const createHref = `/${locale}/ai-chat/projects?create=1`;
  return (
    <Subject
      isServer={false}
      variant="me-social-module-profile-list-ai-chat"
      data={props.data}
      initialProjects={props.projects}
      renderError={({ retry }) => (
        <EmptyProjectSelect
          isServer={false}
          createHref={createHref}
          error
          onRetry={retry}
        />
      )}
      loading={
        <EmptyProjectSelect isServer={false} createHref={createHref} pending />
      }
      renderProjects={({ projects }) => {
        const current = projects.find(
          (item) =>
            item.profile.id === props.profileId &&
            (!props.chatId || item.chat.id === props.chatId),
        );
        if (!current)
          return (
            <EmptyProjectSelect
              isServer={false}
              createHref={createHref}
              empty={!projects.length}
            >
              {projects.map((item) => (
                <SocialModuleProfile
                  key={`${item.profile.id}:${item.chat.id}`}
                  isServer={false}
                  variant="select-item-ai-chat-project"
                  data={item.profile}
                  dataSource="props"
                  href={`/${locale}${projectHref(item)}`}
                  selected={false}
                />
              ))}
            </EmptyProjectSelect>
          );
        return (
          <SocialModuleProfile
            isServer={false}
            variant="select-ai-chat-project"
            data={current.profile}
            dataSource="props"
            createHref={createHref}
          >
            {projects.map((item) => (
              <SocialModuleProfile
                key={`${item.profile.id}:${item.chat.id}`}
                isServer={false}
                variant="select-item-ai-chat-project"
                data={item.profile}
                dataSource="props"
                href={`/${locale}${projectHref(item)}`}
                selected={
                  item.profile.id === current?.profile.id &&
                  item.chat.id === current?.chat.id
                }
              />
            ))}
          </SocialModuleProfile>
        );
      }}
    />
  );
}
