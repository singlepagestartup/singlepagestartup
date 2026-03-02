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
  const typedProps = props;
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
