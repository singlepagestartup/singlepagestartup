import { IComponentPropsExtended } from "./interface";
import { Component as ClientComponent } from "./ClientComponent";

export function Component(props: IComponentPropsExtended) {
  return <ClientComponent {...props} />;
}
