"use client";
import { Component as Subject } from "@sps/rbac/models/subject/frontend/component";
import { projectHref } from "@sps/rbac/models/subject/sdk/model";
import type { IComponentPropsExtended } from "./interface";
import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Component as Projects } from "./Projects";
import { Component as WidgetsToWebsiteBuilderModuleWidgets } from "@sps/rbac/relations/widgets-to-website-builder-module-widgets/frontend/component";
export function Component(props: IComponentPropsExtended) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const creating = searchParams?.get("create") === "1";
  const setCreating = useCallback(
    (value: boolean) => {
      const params = new URLSearchParams(searchParams?.toString());
      if (value) params.set("create", "1");
      else params.delete("create");
      const query = params.toString();
      router.push(`${pathname}${query ? `?${query}` : ""}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );
  const openCreate = useCallback(() => setCreating(true), [setCreating]);
  const closeCreate = useCallback(() => setCreating(false), [setCreating]);
  return (
    <div
      data-module="rbac"
      data-model="widget"
      data-variant={props.variant}
      data-id={props.data?.id}
      className="w-full min-w-0"
    >
      <Subject
        isServer={false}
        variant="authentication-me-default"
        skeleton={<Projects projects={[]} pending />}
        fallback={
          <Projects
            projects={[]}
            error
            onRetry={() => window.location.reload()}
          />
        }
        unauthenticatedRedirectHref={`/${props.language || "en"}/ai-chat/sign-in`}
      >
        {({ data, authenticated }) => {
          if (!data || !authenticated) return null;
          return (
            <Subject
              isServer={false}
              variant="me-social-module-profile-list-ai-chat"
              data={data}
              loading={<Projects projects={[]} pending onCreate={openCreate} />}
              renderError={({ retry }) => (
                <Projects
                  projects={[]}
                  error
                  onRetry={retry}
                  onCreate={openCreate}
                />
              )}
              renderProjects={({ projects }) => {
                return (
                  <Projects
                    variant={props.variant}
                    creating={creating}
                    onCreate={openCreate}
                    onCancel={closeCreate}
                    projects={projects.map((project) => ({
                      id: project.profile.id,
                      name:
                        project.profile.title?.[props.language || "en"] ||
                        project.profile.title?.en ||
                        "Untitled project",
                      href: `/${props.language || "en"}${projectHref(project)}`,
                    }))}
                  >
                    <WidgetsToWebsiteBuilderModuleWidgets
                      isServer={false}
                      variant="find"
                      apiProps={{
                        params: {
                          filters: {
                            and: [
                              {
                                column: "widgetId",
                                method: "eq",
                                value: props.data.id,
                              },
                              {
                                column: "variant",
                                method: "eq",
                                value: "ai-chat-content",
                              },
                            ],
                          },
                        },
                      }}
                    >
                      {({ data: links }) =>
                        links?.length === 1 ? (
                          links.map((link) => (
                            <WidgetsToWebsiteBuilderModuleWidgets
                              key={link.id}
                              isServer={false}
                              variant="ai-chat-content"
                              dataSource="props"
                              data={link}
                              mode="project-create"
                              language={props.language}
                            >
                              <Subject
                                isServer={false}
                                variant="me-social-module-profile-create-ai-chat"
                                data={data}
                                projects={projects}
                                hideBackLink
                              />
                            </WidgetsToWebsiteBuilderModuleWidgets>
                          ))
                        ) : (
                          <p role="alert">
                            Project creation content is unavailable.
                          </p>
                        )
                      }
                    </WidgetsToWebsiteBuilderModuleWidgets>
                  </Projects>
                );
              }}
            />
          );
        }}
      </Subject>
    </div>
  );
}
