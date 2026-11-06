import { Component as ClientComponent } from "./ClientComponent";
import type { IComponentPropsExtended } from "./interface";

export function Component(props: IComponentPropsExtended) {
  return (
    <ClientComponent
      language={props.language}
      isServer={props.isServer}
      variant={props.variant}
      data={props.data}
      className={props.className}
      children={props.children}
      identity={props.identity}
      canRemove={props.canRemove}
    />
  );
}
