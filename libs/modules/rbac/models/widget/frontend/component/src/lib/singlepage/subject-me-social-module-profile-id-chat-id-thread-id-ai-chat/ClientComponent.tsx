"use client";
import { internationalization } from "@sps/shared-configuration";
import { Component as Profile } from "@sps/social/models/profile/frontend/component";
import { Component as Chat } from "@sps/social/models/chat/frontend/component";
import { Component as Subject } from "@sps/rbac/models/subject/frontend/component";
import { api as subjectApi } from "@sps/rbac/models/subject/sdk/server";
import { clientHost } from "@sps/rbac/models/subject/sdk/model";
import { saturateHeaders } from "@sps/shared-frontend-client-utils";
import type { IClientComponentProps } from "./interface";
import { Component as WorkspaceSkeleton } from "./Skeleton";
import { Component as WorkspaceNotice } from "./Error";
export function Component(props: IClientComponentProps) {
  const language = props.language || internationalization.defaultLanguage.code;
  const ru = language === "ru";
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
        skeleton={
          <WorkspaceSkeleton language={language} stage="checking-session" />
        }
        fallback={
          <WorkspaceNotice
            language={language}
            state="error"
            message={
              ru
                ? "Не удалось проверить вход. Повторите попытку."
                : "We couldn't check your session. Please try again."
            }
            onRetry={() => window.location.reload()}
          />
        }
        unauthenticatedRedirectHref={`/${language}/ai-chat/sign-in`}
      >
        {({ data, authenticated }) => {
          if (!data || !authenticated) return null;
          return (
            <Subject
              language={language}
              isServer={props.isServer}
              variant="me-social-module-profile-list-ai-chat"
              data={data}
              loading={
                <WorkspaceSkeleton
                  language={language}
                  stage="loading-projects"
                />
              }
              renderError={({ retry }) => (
                <WorkspaceNotice
                  language={language}
                  state="error"
                  onRetry={retry}
                />
              )}
              renderProjects={({ projects }) => {
                const project = projects.find(
                  (item) =>
                    item.profile.id === props.socialModuleProfileId &&
                    item.chat.id === props.socialModuleChatId,
                );
                if (!project)
                  return (
                    <WorkspaceNotice
                      language={language}
                      state="access-denied"
                      projectsHref={`/${language}/ai-chat/projects`}
                      signInHref={`/${language}/ai-chat/sign-in`}
                    />
                  );
                const navigation = (
                  <Subject
                    isServer={props.isServer}
                    variant="me-social-module-profile-id-navigation-ai-chat"
                    language={language}
                    data={data}
                    project={project}
                    socialModuleThreadId={props.socialModuleThreadId}
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
                      <Chat
                        isServer={props.isServer}
                        variant="id-ai-chat"
                        data={project.chat}
                        apiProps={{
                          reactQueryOptions: {
                            initialData: project.chat,
                            queryFn: async () =>
                              (
                                await subjectApi.socialModuleProfileProjects({
                                  id: data.id,
                                  host: clientHost,
                                  options: {
                                    headers: saturateHeaders({
                                      "Cache-Control": "no-store",
                                    }),
                                  },
                                })
                              ).find((item) => item.chat.id === project.chat.id)
                                ?.chat,
                          },
                        }}
                      >
                        <Subject
                          language={language}
                          isServer={props.isServer}
                          variant="me-social-module-profile-id-chat-id-thread-id-ai-chat"
                          data={data}
                          project={project}
                          navigation={navigation}
                          socialModuleThreadId={props.socialModuleThreadId}
                          renderLoadError={({ retry, unavailable }) => (
                            <WorkspaceNotice
                              language={language}
                              state={unavailable ? "access-denied" : "error"}
                              embedded
                              onRetry={retry}
                              projectsHref={`/${language}/ai-chat/projects`}
                              signInHref={`/${language}/ai-chat/sign-in`}
                            />
                          )}
                          loading={
                            <WorkspaceSkeleton
                              language={language}
                              stage="loading-chat"
                              embedded
                            />
                          }
                        />
                      </Chat>
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
