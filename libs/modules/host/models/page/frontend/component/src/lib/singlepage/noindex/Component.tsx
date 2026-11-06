import { Component as DefaultView } from "../default/Component";
import type { IComponentPropsExtended } from "./interface";

export function Component(props: IComponentPropsExtended) {
  return <DefaultView {...props} variant="default" />;
}
