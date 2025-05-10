import { Component as ListDefault } from "./list-default/Component";
import { IComponentProps } from "./interface";

export function Component(props: IComponentProps) {
  if (props.variant === "me-ecommerce-order-list-default") {
    return <ListDefault {...props} />;
  }

  return <></>;
}
