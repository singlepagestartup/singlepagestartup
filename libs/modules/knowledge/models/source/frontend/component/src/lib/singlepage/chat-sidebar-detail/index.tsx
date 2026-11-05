import { IComponentProps } from "./interface";
import { Component as ChildComponent } from "./Component";

export function Component(props: IComponentProps) {
  return <ChildComponent {...props} />;
}
