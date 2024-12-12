"use client";
import "client-only";

import { Component } from "./Component";
import { Skeleton } from "./Skeleton";
import { IComponentProps } from "./interface";
import { api } from "@sps/rbac/models/subject/sdk/client";

export default function Client(props: IComponentProps) {
  const { data, isFetching, isLoading } = api.isAuthorized(props.apiProps);

  if (isFetching || isLoading) {
    return props.skeleton ?? <Skeleton />;
  }

  if (!data) {
    return props.fallback ?? <></>;
  }

  return <Component {...props} />;
}
