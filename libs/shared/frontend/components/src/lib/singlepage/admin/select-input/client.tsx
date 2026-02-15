"use client";
import "client-only";

import { factory } from "@sps/shared-frontend-client-api";
import { IComponentProps, IComponentPropsExtended } from "./interface";
import { ReactNode } from "react";
import { Component as ChildComponent } from "./Component";

export function Component<
  M extends { id?: string },
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
  return <ChildComponent {...props} />;
}
