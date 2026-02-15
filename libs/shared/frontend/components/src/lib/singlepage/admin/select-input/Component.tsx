import { ReactNode } from "react";
import { IComponentPropsExtended, IComponentProps } from "./interface";
import { factory } from "@sps/shared-frontend-client-api";
import { Component as ClientComponent } from "./ClientComponent";

type TSelectRenderProps<M extends { id?: string }, V> = IComponentPropsExtended<
  M,
  V,
  IComponentProps<M, V>
> & {
  label?: string;
  module: string;
  name: string;
  type?: "model" | "relation";
  renderFunction?: (entity: M) => any;
};

type TSelectContainerProps<M extends { id?: string }, V> = IComponentProps<
  M,
  V
> & {
  api: ReturnType<typeof factory<M>>;
  Skeleton?: ReactNode;
  Component: React.ComponentType<
    IComponentPropsExtended<M, V, IComponentProps<M, V>>
  >;
};

export function Component<M extends { id?: string }, V>(
  props: TSelectContainerProps<M, V> | TSelectRenderProps<M, V>,
) {
  if (props.isServer) {
    return null;
  }

  return <ClientComponent {...props} />;
}
