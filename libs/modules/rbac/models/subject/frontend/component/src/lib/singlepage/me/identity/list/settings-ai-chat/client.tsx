"use client";
import { Skeleton } from "./Skeleton";
import "client-only";
import { api as subjectApi } from "@sps/rbac/models/subject/sdk/client";
import { Component as ChildComponent } from "./Component";
import type { IComponentProps } from "./interface";
export default function Client(props: IComponentProps) {
  const identities = subjectApi.identityFind({
    options: props.apiProps?.options
      ? { ...props.apiProps.options, next: { ...props.apiProps.options.next } }
      : undefined,

    id: props.data.id,
    reactQueryOptions: { retry: false },
  });
  if (identities.isPending)
    return props.skeleton ?? <Skeleton language={props.language} />;
  return (
    <ChildComponent
      {...props}
      identitiesRead={{
        data: identities.data,
        isPending: identities.isPending,
        isFetching: identities.isFetching,
        isError: identities.isError,
        error: identities.error
          ? { message: identities.error.message }
          : undefined,
        refetch: () => {
          void identities.refetch();
        },
      }}
    />
  );
}
