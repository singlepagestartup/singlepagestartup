"use client";
import "client-only";

import { factory } from "@sps/shared-frontend-client-api";
import { IComponentProps, IComponentPropsExtended } from "./interface";
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
  const { data: count } = props.api.count({
    params: props.apiProps?.params,
    options: {
      ...props.apiProps?.options,
      headers: {
        ...props.apiProps?.options?.headers,
        "Cache-Control": "no-store",
      },
    },
  });

  return <Child {...props} isServer={false} data={[]} count={count ?? 0} />;
}
