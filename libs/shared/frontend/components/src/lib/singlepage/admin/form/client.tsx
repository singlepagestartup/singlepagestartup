"use client";
import "client-only";

import { factory } from "@sps/shared-frontend-client-api";
import { IComponentProps, IComponentPropsExtended } from "./interface";
import { Component as Skeleton } from "./Skeleton";
import { ReactNode } from "react";

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

  if (props.data?.id) {
    const { data, isLoading } = props.api.findById({
      id: props.data.id,
      ...props.apiProps,
    });

    if (isLoading || !data) {
      return props.Skeleton ?? <Skeleton />;
    }

    return <Child {...props} isServer={false} data={data} />;
  }

  return <Child {...props} isServer={false} data={undefined} />;
}
