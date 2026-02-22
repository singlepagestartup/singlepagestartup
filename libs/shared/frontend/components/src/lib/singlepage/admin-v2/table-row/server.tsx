"use server";
import "server-only";

import { IComponentProps } from "./interface";
import { IComponentPropsExtended } from "./interface";
import { factory } from "@sps/shared-frontend-server-api";
import { Component as HeadlessComponent } from "./ClientComponent";

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
>(props: (CP & Partial<A>) | IComponentProps) {
  if (!("api" in props) || !props.api || !("Component" in props)) {
    return <HeadlessComponent {...(props as IComponentProps)} />;
  }

  const typedProps = props as CP & A;
  const { Component: Child } = typedProps;
  const dataId = (typedProps.data as { id?: string } | undefined)?.id;

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
