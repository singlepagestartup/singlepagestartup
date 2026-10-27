import { Component as Action } from "../action/Component";
import type { IComponentPropsExtended } from "./interface";
export function Component(props: IComponentPropsExtended) {
  return <Action {...props} />;
}
