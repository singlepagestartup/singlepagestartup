import { IComponentProps } from "./interface";
import { Component as Client } from "./client";
import { Component as Server } from "./server";

export function Component<M extends { id?: string }>(
  props: IComponentProps<M>,
) {
  const Comp: any = props.isServer ? Server : Client;
  return <Comp {...props} />;
}
