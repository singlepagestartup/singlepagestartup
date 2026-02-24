"use server";
import "server-only";

import { IComponentPropsExtended, IComponentProps } from "./interface";
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
  const typedProps = props;
  const { Component: Child } = typedProps;
  const dataId = typedProps.data.id;

  if (!dataId) {
    return <></>;
  }

  const data = await typedProps.api.findById({
    id: dataId,
    ...typedProps.apiProps,
  });

  if (!data) {
    return <></>;
  }

  return (
    <Child
      module={typedProps.module}
      variant={typedProps.variant}
      isServer={typedProps.isServer}
      data={data}
      name={typedProps.name}
      type={typedProps.type}
    />
  );
}
