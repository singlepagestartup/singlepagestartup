import { IComponentProps } from "./interface";
import { Component as ClientComponent } from "./ClientComponent";

export function Component<M extends { id?: string }, V>(
  props: IComponentProps<M, V>,
) {
  return <ClientComponent {...(props as IComponentProps)} />;
}
