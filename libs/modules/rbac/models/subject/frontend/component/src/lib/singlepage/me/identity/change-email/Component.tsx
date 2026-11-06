import { Component as ClientComponent } from "./ClientComponent";
import type { IComponentPropsExtended } from "./interface";

export function Component(props: IComponentPropsExtended) {
  return (
    <ClientComponent
      language={props.language}
      isServer={props.isServer}
      variant={props.variant}
      data={props.data}
      identity={props.identity}
      className={props.className}
    />
  );
}
