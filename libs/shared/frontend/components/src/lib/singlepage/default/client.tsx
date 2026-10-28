"use client";

import {
  publicReadOptions,
  shouldHideRecord,
} from "@sps/shared-utils/public-read";
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

  const { data, isLoading } = props.api.findById(
    publicReadOptions({
      id: props.data.id,
      ...props.apiProps,
    }),
  );

  const passProps: any = { ...props, data };
  delete passProps.Component;
  delete passProps.Skeleton;
  delete passProps.api;
  delete passProps.Provider;
  delete passProps.clientApi;
  delete passProps.serverApi;

  if (isLoading || !data) {
    return props.Skeleton ?? <Skeleton />;
  }

  if (shouldHideRecord(data, props.variant)) return null;
  return <Child {...passProps} data={data} />;
}
