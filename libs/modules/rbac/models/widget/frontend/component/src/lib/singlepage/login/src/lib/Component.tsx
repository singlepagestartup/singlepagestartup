import { IComponentPropsExtended } from "./interface";
import { Component as ClientComponent } from "./ClientComponent";

export function Component(props: IComponentPropsExtended) {
  return (
    <ClientComponent
      isServer={props.isServer}
      hostUrl={props.hostUrl}
      variant="login"
      data={props.data}
      className={props.className}
    />
  );
}
