import { IComponentPropsExtended } from "./interface";
import { Component as ClientAction } from "./ClientAction";

export function Component(props: IComponentPropsExtended) {
  return <ClientAction {...props} />;
}
