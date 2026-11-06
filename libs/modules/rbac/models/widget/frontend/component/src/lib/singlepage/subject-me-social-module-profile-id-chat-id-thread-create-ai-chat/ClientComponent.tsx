"use client";
import { internationalization } from "@sps/shared-configuration";
import { Component as Profile } from "@sps/social/models/profile/frontend/component";
import { Component as Subject } from "@sps/rbac/models/subject/frontend/component";
import type { IClientComponentProps } from "./interface";
export function Component(props: IClientComponentProps) {
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
        unauthenticatedRedirectHref={`/${props.language || internationalization.defaultLanguage.code}/ai-chat/sign-in`}
      >
        {({ data, authenticated }) => {
          if (!data || !authenticated) return null;
          return (
            <Subject
              language={props.language}
              isServer={props.isServer}
              variant="me-social-module-profile-list-ai-chat"
              data={data}
              renderProjects={({ projects }) => {
                const project = projects.find(
                  (item) =>
                    item.profile.id === props.socialModuleProfileId &&
                    item.chat.id === props.socialModuleChatId,
                );
                if (!project)
                  return (
                    <p role="alert" className="p-8">
                      {(props.language ||
                        internationalization.defaultLanguage.code) === "ru"
                        ? "Этот проект недоступен в вашем аккаунте."
                        : "This project is unavailable in your workspace."}
                    </p>
                  );
                const navigation = (
                  <Subject
                    isServer={props.isServer}
                    variant="me-social-module-profile-id-navigation-ai-chat"
                    language={props.language}
                    data={data}
                    project={project}
                    socialModuleThreadId={props.socialModuleThreadId}
                    selected="create"
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
                        language={props.language}
                        isServer={props.isServer}
                        variant="me-social-module-profile-id-chat-id-thread-create-ai-chat"
                        data={data}
                        projects={projects}
                        project={project}
                        socialModuleThreadId={props.socialModuleThreadId}
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
