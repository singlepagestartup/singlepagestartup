"use client";
import "client-only";

import { IComponentProps } from "./interface";
import { Component as Skeleton } from "./Skeleton";
import { api } from "@sps/billing/models/currency/sdk/client";
import { Component as Child } from "./Component";

export function Component(props: IComponentProps) {
  const { data, isLoading } = api.find({
    ...props.apiProps,
  });

  if (isLoading || !data) {
    return props.skeleton ?? <Skeleton />;
  }

  return <Child {...props} data={data} />;
}
