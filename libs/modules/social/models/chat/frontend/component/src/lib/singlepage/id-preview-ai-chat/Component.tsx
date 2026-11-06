import { Component as ClientComponent } from "./ClientComponent";
import type { IComponentPropsExtended } from "./interface";

export function Component(props: IComponentPropsExtended) {
  return (
    <ClientComponent
      variant={props.variant}
      data={props.data}
      className={props.className}
      isServer={props.isServer}
    />
  );
}
