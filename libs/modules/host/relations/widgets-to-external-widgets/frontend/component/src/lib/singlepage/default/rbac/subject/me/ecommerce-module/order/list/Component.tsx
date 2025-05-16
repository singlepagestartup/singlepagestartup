import { IComponentProps } from "./interface";
import { Component as CheckoutDefault } from "./checkout-default/Component";

export function Component(props: IComponentProps) {
  if (props.variant === "me-ecommerce-module-order-list-checkout-default") {
    return <CheckoutDefault {...props} />;
  }

  return <></>;
}
