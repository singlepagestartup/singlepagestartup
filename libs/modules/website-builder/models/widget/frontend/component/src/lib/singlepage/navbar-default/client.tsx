"use client";
import "client-only";

import { Component } from "./Component";
import { Skeleton } from "./Skeleton";
import { IComponentProps } from "./interface";
import { api } from "@sps/website-builder/models/widget/sdk/client";
import { Component as Logotype } from "./assets/logotype";
import { Component as Content } from "./assets/content";

export default function Client(props: IComponentProps) {
  const { data, isFetching, isLoading } = api.findById({
    id: props.data.id,
    ...props.apiProps,
  });

  if (isFetching || isLoading || !data) {
    return <Skeleton />;
  }

  const logotype = (
    <Logotype isServer={props.isServer} variant={props.variant} data={data} />
  );
  const content = (
    <Content isServer={props.isServer} variant={props.variant} data={data} />
  );

  return (
    <Component
      isServer={props.isServer}
      variant={props.variant}
      data={data}
      content={content}
      logotype={logotype}
      children={props.children}
    />
  );
}
