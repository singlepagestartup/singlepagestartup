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

  if (typedProps.data?.id) {
    const data = await typedProps.api.findById({
      id: typedProps.data.id,
      ...typedProps.apiProps,
    });

    return (
      <Child
        variant={typedProps.variant}
        isServer={typedProps.isServer}
        data={data}
      />
    );
  }

  return (
    <Child
      variant={typedProps.variant}
      isServer={typedProps.isServer}
      data={undefined}
    />
  );
}
