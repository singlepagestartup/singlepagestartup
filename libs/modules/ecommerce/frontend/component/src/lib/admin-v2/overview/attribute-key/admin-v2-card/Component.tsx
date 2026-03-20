import { Component as ParentComponent } from "@sps/ecommerce/models/attribute-key/frontend/component";
import { IComponentProps } from "./interface";

export function Component(props: IComponentProps) {
  return <ParentComponent variant="admin-v2-card" isServer={props.isServer} />;
}
