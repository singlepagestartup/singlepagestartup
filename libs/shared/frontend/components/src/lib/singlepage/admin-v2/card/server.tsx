"use server";
import "server-only";

import { IComponentProps, IComponentPropsExtended } from "./interface";
import { factory } from "@sps/shared-frontend-server-api";

export async function Component<
  M extends { id: string },
  V,
  A extends {
    api: ReturnType<typeof factory<M>>;
    Skeleton: React.ComponentType;
    Component: React.ComponentType<
      IComponentPropsExtended<M, V, IComponentProps<M, V>>
    >;
  },
  CP extends IComponentProps<M, V>,
>(props: CP & A) {
  const { Component: Child } = props;
  const count = await props.api.count({
    params: props.apiProps?.params,
    options: {
      ...props.apiProps?.options,
      headers: {
        ...props.apiProps?.options?.headers,
        "Cache-Control": "no-store",
      },
    },
  });

  return (
    <Child
      module={props.module}
      variant={props.variant}
      isServer={props.isServer}
      data={[]}
      name={props.name}
      type={props.type}
      apiRoute={props.apiRoute}
      href={props.href}
      count={count ?? 0}
    />
  );
}
