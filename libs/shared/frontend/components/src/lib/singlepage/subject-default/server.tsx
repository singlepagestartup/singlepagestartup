"use server";

import { publicReadOptions } from "@sps/shared-utils/public-read";
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

  if (!props.data.id) {
    return <></>;
  }

  const data = await props.api.findById(
    publicReadOptions({
      id: props.data.id,
      ...props.apiProps,
    }),
  );

  if (!data) {
    return <></>;
  }

  const passProps: any = { ...props, data };
  delete passProps.Component;
  delete passProps.Skeleton;
  delete passProps.api;
  delete passProps.Provider;
  delete passProps.clientApi;
  delete passProps.serverApi;

  return <Child {...passProps} data={data} />;
}
