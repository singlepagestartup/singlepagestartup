"use server";
import "server-only";
import { api as subjectApi } from "@sps/rbac/models/subject/sdk/server";
import { Component as ChildComponent } from "./Component";
import type { IComponentProps } from "./interface";
export default async function Server(props: IComponentProps) {
  try {
    const profiles = await subjectApi.socialModuleProfileFind({
      id: props.data.id,
      params: {
        filters: {
          and: [
            {
              column: "variant",
              method: "eq",
              value: "artificial-intelligence",
            },
          ],
        },
      },
      options: props.apiProps?.options,
    });
    const contexts = profiles.length
      ? await subjectApi.socialModuleProfileProjects({
          id: props.data.id,
          options: props.apiProps?.options,
        })
      : [];
    const profileIds = new Set(profiles.map((profile) => profile.id));
    return (
      <ChildComponent
        {...props}
        loadedProjects={contexts.filter((project) =>
          profileIds.has(project.profile.id),
        )}
        projectsLoading={false}
      />
    );
  } catch (error) {
    return (
      <ChildComponent
        {...props}
        projectsLoading={false}
        projectsError={
          error instanceof Error
            ? error.message
            : "Projects could not be loaded."
        }
      />
    );
  }
}
