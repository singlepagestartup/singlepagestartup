import { IComponentPropsExtended } from "./interface";
import { Component as ClientComponent } from "./ClientComponent";

export function Component(_props: IComponentPropsExtended) {
  return <ClientComponent />;
}
