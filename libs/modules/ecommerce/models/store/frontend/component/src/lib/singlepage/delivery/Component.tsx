import { Component as Default } from "../default/Component";
import type { IComponentPropsExtended } from "./interface";

export function Component(props: IComponentPropsExtended) {
  return <Default {...props} variant="default" dataVariant={props.variant} />;
}
