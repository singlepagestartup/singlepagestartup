import { Component as Actions } from "../actions/Component";
import type { IComponentPropsExtended } from "./interface";
export function Component(props: IComponentPropsExtended) {
  return <Actions {...props} />;
}
