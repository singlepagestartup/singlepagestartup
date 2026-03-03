import { Component as ChildComponent } from "./Component";
import { IComponentProps } from "./interface";

export function Component(props: IComponentProps) {
  return <ChildComponent {...props} />;
}
