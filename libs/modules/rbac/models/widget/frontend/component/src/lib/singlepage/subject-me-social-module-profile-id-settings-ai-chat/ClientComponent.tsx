"use client";
import { Component as Profile } from "@sps/social/models/profile/frontend/component";
import { Component as Subject } from "@sps/rbac/models/subject/frontend/component";
import type { IComponentPropsExtended } from "./interface";
export function Component(props: IComponentPropsExtended) {
  return (
    <div
      data-module="rbac"
      data-model="widget"
      data-variant={props.variant}
      data-id={props.data?.id}
      className="w-full min-w-0"
    >
      <Subject
        isServer={props.isServer}
        variant="authentication-me-default"
        unauthenticatedRedirectHref={`/${props.language || "en"}/ai-chat/sign-in`}
      >
        {({ data, authenticated }) => {
          if (!data || !authenticated) return null;
          return (
            <Subject
              isServer={props.isServer}
              variant="me-social-module-profile-list-ai-chat"
              data={data}
              renderProjects={({ projects }) => {
                const project = projects.find(
                  (item) =>
                    item.profile.id === props.profileId &&
                    item.chat.id === props.chatId,
                );
                if (!project)
                  return (
                    <p role="alert" className="p-8">
                      This project is unavailable in your workspace.
                    </p>
                  );
                const navigation = (
                  <Subject
                    isServer={props.isServer}
                    variant="me-social-module-profile-id-navigation-ai-chat"
                    language={props.language}
                    data={data}
                    project={project}
                    threadId={props.threadId}
                    selected="settings"
                  />
                );
                return (
                  <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
                    <Profile
                      isServer={props.isServer}
                      variant="id-ai-chat-project"
                      data={project.profile}
                      navigation={navigation}
                    >
                      <Subject
                        isServer={props.isServer}
                        variant="me-social-module-profile-id-settings-ai-chat"
                        data={data}
                        projects={projects}
                        project={project}
                        threadId={props.threadId}
                      />
                    </Profile>
                  </main>
                );
              }}
            />
          );
        }}
      </Subject>
    </div>
  );
}
