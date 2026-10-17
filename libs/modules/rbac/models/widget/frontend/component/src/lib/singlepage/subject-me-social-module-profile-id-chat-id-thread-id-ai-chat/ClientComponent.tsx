"use client";
import { Component as Profile } from "@sps/social/models/profile/frontend/component";
import { Component as Chat } from "@sps/social/models/chat/frontend/component";
import { Component as Subject } from "@sps/rbac/models/subject/frontend/component";
import { api as subjectApi } from "@sps/rbac/models/subject/sdk/server";
import { clientHost } from "@sps/rbac/models/subject/sdk/model";
import { saturateHeaders } from "@sps/shared-frontend-client-utils";
import type { IComponentPropsExtended } from "./interface";
import { Component as WorkspaceSkeleton } from "./Skeleton";
import { Component as WorkspaceNotice } from "./Error";
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
        skeleton={<WorkspaceSkeleton stage="checking-session" />}
        fallback={
          <WorkspaceNotice
            state="error"
            message="We couldn't check your session. Please try again."
            onRetry={() => window.location.reload()}
          />
        }
        unauthenticatedRedirectHref={`/${props.language || "en"}/ai-chat/sign-in`}
      >
        {({ data, authenticated }) => {
          if (!data || !authenticated) return null;
          return (
            <Subject
              isServer={props.isServer}
              variant="me-social-module-profile-list-ai-chat"
              data={data}
              loading={<WorkspaceSkeleton stage="loading-projects" />}
              renderError={({ retry }) => (
                <WorkspaceNotice state="error" onRetry={retry} />
              )}
              renderProjects={({ projects }) => {
                const project = projects.find(
                  (item) =>
                    item.profile.id === props.profileId &&
                    item.chat.id === props.chatId,
                );
                if (!project)
                  return (
                    <WorkspaceNotice
                      state="access-denied"
                      projectsHref={`/${props.language || "en"}/ai-chat/projects`}
                      signInHref={`/${props.language || "en"}/ai-chat/sign-in`}
                    />
                  );
                const navigation = (
                  <Subject
                    isServer={props.isServer}
                    variant="me-social-module-profile-id-navigation-ai-chat"
                    language={props.language}
                    data={data}
                    project={project}
                    threadId={props.threadId}
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
                          isServer={props.isServer}
                          variant="me-social-module-profile-id-chat-id-thread-id-ai-chat"
                          data={data}
                          project={project}
                          navigation={navigation}
                          threadId={props.threadId}
                          renderLoadError={({ retry, unavailable }) => (
                            <WorkspaceNotice
                              state={unavailable ? "access-denied" : "error"}
                              embedded
                              onRetry={retry}
                              projectsHref={`/${props.language || "en"}/ai-chat/projects`}
                              signInHref={`/${props.language || "en"}/ai-chat/sign-in`}
                            />
                          )}
                          loading={
                            <WorkspaceSkeleton stage="loading-chat" embedded />
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
