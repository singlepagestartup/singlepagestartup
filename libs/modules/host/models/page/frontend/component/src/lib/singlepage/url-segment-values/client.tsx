"use client";
import "client-only";

import { api } from "@sps/host/models/page/sdk/client";
import type { IComponentProps } from "./interface";
import { Component as ChildComponent } from "./Component";
import { Skeleton } from "./Skeleton";

export default function Client(props: IComponentProps) {
  const { data, isLoading } = api.findByUrl({
    language: props.language,
    url: props.url,
  });

  if (isLoading) return <Skeleton />;

  return (
    <ChildComponent
      isServer={false}
      variant={props.variant}
      url={props.url}
      data={data?.routeParams}
    >
      {props.children}
    </ChildComponent>
  );
}
