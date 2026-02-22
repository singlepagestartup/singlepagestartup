import { IComponentPropsExtended } from "./interface";
import { Component as RootComponent } from "./Component";

export function Component(props: IComponentPropsExtended) {
  return <RootComponent {...props} />;
}
