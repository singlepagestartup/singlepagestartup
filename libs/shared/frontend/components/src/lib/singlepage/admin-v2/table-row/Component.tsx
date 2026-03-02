import { ReactNode } from "react";
import { IComponentProps, IComponentPropsExtended } from "./interface";
import { Component as ClientComponent } from "./ClientComponent";

export function Component<M extends { id: string }, V>(
  props: IComponentPropsExtended<M, V, IComponentProps<M, V>> & {
    onDelete?: (e: any) => void;
    children?: ReactNode;
  },
) {
  return <ClientComponent {...props} />;
}
