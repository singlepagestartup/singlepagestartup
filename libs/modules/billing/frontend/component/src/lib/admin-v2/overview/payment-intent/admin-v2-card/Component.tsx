import { Component as ParentComponent } from "@sps/billing/models/payment-intent/frontend/component";
import { IComponentProps } from "./interface";

export function Component(props: IComponentProps) {
  return <ParentComponent variant="admin-v2-card" isServer={props.isServer} />;
}
