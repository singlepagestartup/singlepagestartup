import { IComponentProps } from "./interface";
import { Component as ListDefault } from "./default/Component";
import { Component as ListTotalDefault } from "./total-default/Component";

export function Component(props: IComponentProps) {
  if (props.variant === "me-ecommerce-order-list-default") {
    return <ListDefault {...props} />;
  }

  if (props.variant === "me-ecommerce-order-list-total-default") {
    return <ListTotalDefault {...props} />;
  }

  return <></>;
}
