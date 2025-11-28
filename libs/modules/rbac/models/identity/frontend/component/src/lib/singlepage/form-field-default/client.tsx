"use client";
import "client-only";

import { Component } from "./Component";
import { IComponentProps } from "./interface";
import { api } from "@sps/rbac/models/identity/sdk/client";
import { Skeleton } from "./Skeleton";

export default function Client(props: IComponentProps) {
  const { data, isLoading } = api.findById({
    id: props.data.id,
    ...props.apiProps,
  });

  if (isLoading || !data) {
    return <Skeleton />;
  }

  return <Component {...props} data={data} />;
}
