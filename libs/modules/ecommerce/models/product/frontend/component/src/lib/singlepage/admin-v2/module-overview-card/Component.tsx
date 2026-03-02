import { IComponentPropsExtended } from "./interface";
import { Component as ClientComponent } from "./ClientComponent";

export function Component(props: IComponentPropsExtended) {
  return (
    <ClientComponent
      isServer={false}
      variant={props.variant}
      href={props.href}
      header={props.header}
    />
  );
}
