import { Component as ParentComponent } from "@sps/website-builder/models/feature/frontend/component";
import { IComponentProps } from "./interface";

export function Component(props: IComponentProps) {
  return <ParentComponent isServer={props.isServer} variant="admin-v2-card" />;
}
