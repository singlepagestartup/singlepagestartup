"use client";
import "client-only";

import { Component } from "./Component";
import { Skeleton } from "./Skeleton";
import { IComponentProps } from "./interface";
import { api } from "@sps/blog/models/widget/sdk/client";

export default function Client(props: IComponentProps) {
  const { data, isLoading } = api.findById({
    id: props.data.id,
    ...props.apiProps,
  });

  if (isLoading || !data) {
    return <Skeleton />;
  }

  return <Component {...props} isServer={false} data={data} />;
}
