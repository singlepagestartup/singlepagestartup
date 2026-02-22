"use client";
import "client-only";

import { factory } from "@sps/shared-frontend-client-api";
import { IComponentProps } from "./interface";
import { IComponentPropsExtended } from "./interface";
import { Component as Skeleton } from "./Skeleton";
import { Component as HeadlessComponent } from "./ClientComponent";
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
>(props: (CP & Partial<A>) | IComponentProps) {
  if (!("api" in props) || !props.api || !("Component" in props)) {
    return <HeadlessComponent {...(props as IComponentProps)} />;
  }

  const typedProps = props as CP & A;
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
