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

  if (props.data?.id) {
    const data = await props.api.findById({
      id: props.data.id,
      ...props.apiProps,
    });

    if (!data) {
      return <></>;
    }

    return (
      <Child
        module={props.module}
        variant={props.variant}
        hostUrl={props.hostUrl}
        isServer={props.isServer}
        data={data}
        name={props.name}
        type={props.type}
      />
    );
  }

  return <></>;
}
