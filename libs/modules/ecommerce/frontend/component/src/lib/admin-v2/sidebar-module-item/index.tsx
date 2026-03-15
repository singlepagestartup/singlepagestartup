import { IComponentProps } from "./interface";
import { Component as ParentComponent } from "./Component";

export function Component(props: IComponentProps) {
  return <ParentComponent url={props.url} isServer={props.isServer} />;
}
