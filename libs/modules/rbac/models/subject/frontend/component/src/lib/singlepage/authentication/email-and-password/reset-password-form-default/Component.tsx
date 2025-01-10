import { IComponentPropsExtended } from "./interface";
import { Component as ClientAction } from "./ClientComponent";

export function Component(props: IComponentPropsExtended) {
  return (
    <ClientAction
      isServer={props.isServer}
      hostUrl={props.hostUrl}
      variant={props.variant}
      className={props.className}
    />
  );
}
