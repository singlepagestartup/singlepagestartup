"use server";
import "server-only";

import { IComponentProps, IComponentPropsExtended } from "./interface";
import { factory } from "@sps/shared-frontend-server-api";
import { Component as ChildComponent } from "./Component";

export async function Component<
  M extends { id?: string },
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
  return <ChildComponent {...(props as any)} />;
}
