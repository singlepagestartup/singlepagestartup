"use client";
import { Skeleton } from "./Skeleton";
import "client-only";
import { api as subjectApi } from "@sps/rbac/models/subject/sdk/client";
import { Component as ChildComponent } from "./Component";
import type { IComponentProps } from "./interface";
export default function Client(props: IComponentProps) {
  const profiles = subjectApi.socialModuleProfileFind({
    options: props.apiProps?.options,
    id: props.data.id,
    params: {
      filters: { and: [{ column: "variant", method: "eq", value: "default" }] },
    },
    reactQueryOptions: { retry: false },
  });
  if (profiles.isPending) return props.skeleton ?? <Skeleton />;
  return (
    <ChildComponent
      {...props}
      profilesRead={{
        data: profiles.data,
        isPending: profiles.isPending,
        isFetching: profiles.isFetching,
        isError: profiles.isError,
        error: profiles.error ? { message: profiles.error.message } : undefined,
        refetch: () => {
          void profiles.refetch();
        },
      }}
    />
  );
}
