import { IComponentProps } from "./interface";
import { Component as ListDefault } from "./default/Component";
import { Component as ListTotalDefault } from "./total-default/Component";
import { Component as CheckoutDefault } from "./checkout-default/Component";

export function Component(props: IComponentProps) {
  if (props.variant === "me-ecommerce-order-list-default") {
    return <ListDefault {...props} />;
  }

  if (props.variant === "me-ecommerce-order-list-total-default") {
    return <ListTotalDefault {...props} />;
  }

  if (props.variant === "me-ecommerce-order-list-checkout-default") {
    return <CheckoutDefault {...props} />;
  }

  return <></>;
}
