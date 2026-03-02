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
  const typedProps = props;
  const { Component: Child } = typedProps;

  if (typedProps.data?.id) {
    const { data, isLoading } = typedProps.api.findById({
      id: typedProps.data.id,
      ...typedProps.apiProps,
    });

    if (isLoading || !data) {
      return typedProps.Skeleton ?? <Skeleton />;
    }

    return <Child {...typedProps} isServer={false} data={data} />;
  }

  return <Child {...typedProps} isServer={false} data={undefined} />;
}
