import { Component as DefaultComponent } from "../default/Component";
import type { IComponentPropsExtended } from "./interface";
/** Subscription requirements link public Products; this view grants no access. */
export function Component(props: IComponentPropsExtended) {
  return (
    <DefaultComponent
      isServer={props.isServer}
      variant="default"
      data={props.data}
      language={props.language}
      className={props.className}
    />
  );
}
