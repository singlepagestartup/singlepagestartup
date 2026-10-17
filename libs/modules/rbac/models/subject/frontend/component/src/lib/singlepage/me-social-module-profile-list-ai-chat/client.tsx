"use client";
import "client-only";
import { api as subjectApi } from "@sps/rbac/models/subject/sdk/client";
import { Component as ChildComponent } from "./Component";
import type { IComponentProps } from "./interface";
export default function Client(props: IComponentProps) {
  const profiles = subjectApi.socialModuleProfileFind({
    options: props.apiProps?.options,
    id: props.data.id,
    reactQueryOptions: {
      initialData: props.initialProjects
        ? [
            ...new Map(
              props.initialProjects.map((project) => [
                project.profile.id,
                project.profile,
              ]),
            ).values(),
          ]
        : undefined,
    },
    params: {
      filters: {
        and: [
          { column: "variant", method: "eq", value: "artificial-intelligence" },
        ],
      },
    },
  });
  const contexts = subjectApi.socialModuleProfileProjects({
    options: props.apiProps?.options,
    id: props.data.id,
    reactQueryOptions: {
      initialData: props.initialProjects,
      enabled: profiles.isSuccess && !!profiles.data?.length,
    },
  });
  const profileIds = new Set(profiles.data?.map((profile) => profile.id));
  return (
    <ChildComponent
      {...props}
      loadedProjects={
        profiles.data?.length
          ? contexts.data?.filter((project) =>
              profileIds.has(project.profile.id),
            )
          : []
      }
      projectsLoading={
        profiles.isPending || (!!profiles.data?.length && contexts.isPending)
      }
      projectsError={profiles.error?.message || contexts.error?.message}
      retryProjects={() => {
        void (profiles.error ? profiles.refetch() : contexts.refetch());
      }}
    />
  );
}
