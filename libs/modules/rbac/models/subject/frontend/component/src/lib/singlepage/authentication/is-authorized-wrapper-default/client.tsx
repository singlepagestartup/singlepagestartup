"use client";
import "client-only";

import { Component as ChildComponent } from "./Component";
import { Skeleton } from "./Skeleton";
import { IComponentProps } from "./interface";
import { api as subjectApi } from "@sps/rbac/models/subject/sdk/client";

export default function Client(props: IComponentProps) {
  const { data, isFetching, isLoading, isError } =
    subjectApi.authenticationIsAuthorized(props.apiProps);

  if (isFetching || isLoading) {
    return props.skeleton ?? <Skeleton />;
  }

  if (!data?.ok || isError) {
    return props.fallback ?? <></>;
  }

  return <ChildComponent {...props} />;
}
