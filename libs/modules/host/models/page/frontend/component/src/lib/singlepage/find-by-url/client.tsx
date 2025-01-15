"use client";
import "client-only";

import { Component } from "./Component";
import { ErrorBoundary } from "@sps/ui-adapter";
import { Skeleton } from "./Skeleton";
import { Error } from "./Error";
import { IComponentProps } from "./interface";
import { api } from "@sps/host/models/page/sdk/client";

export default function Client(props: IComponentProps) {
  const { data, isFetching, isLoading } = api.findByUrl({
    url: props.url,
  });

  if (isFetching || isLoading) {
    return <Skeleton />;
  }

  if (!props.children) {
    return <></>;
  }

  return props.children({ data });
}
