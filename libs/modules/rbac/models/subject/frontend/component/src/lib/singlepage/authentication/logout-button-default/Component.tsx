import { IComponentPropsExtended } from "./interface";
import { Component as ClientAction } from "./ClientComponent";

export function Component(props: IComponentPropsExtended) {
  return (
    <ClientAction
      isServer={props.isServer}
      variant={props.variant}
      className={props.className}
    />
  );
}
