import { IComponentPropsExtended } from "./interface";
import { Component as ChildComponent } from "./Component";

export function Component(props: IComponentPropsExtended) {
  return (
    <ChildComponent
      isServer={props.isServer}
      variant={props.variant}
      adminBasePath={props.adminBasePath}
    />
  );
}
