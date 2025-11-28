"use client";
import "client-only";

import { factory } from "@sps/shared-frontend-client-api";
import { IComponentProps, IComponentPropsExtended } from "./interface";
import { ReactNode } from "react";
import { Component as Skeleton } from "./Skeleton";

export function Component<
  M extends { id: string },
  V,
  A extends {
    api: ReturnType<typeof factory<M>>;
    Skeleton?: ReactNode;
    Component: React.ComponentType<
      IComponentPropsExtended<M, V, IComponentProps<M, V>>
    >;
  },
  CP extends IComponentProps<M, V>,
>(props: CP & A) {
  const { Component: Child } = props;

  const { data, isLoading } = props.api.findById({
    id: props.data.id,
    ...props.apiProps,
  });

  const passProps: any = { ...props, data };
  delete passProps.Component;
  delete passProps.Skeleton;
  delete passProps.api;

  if (isLoading || !data) {
    return props.Skeleton ?? <Skeleton />;
  }

  return <Child {...passProps} data={data} />;
}
