import { Component as CartDefault } from "./cart-default/Component";
import { Component as CheckoutDefault } from "./checkout-default/Component";
import { IComponentProps } from "./interface";

export function Component(props: IComponentProps) {
  if (props.variant === "me-ecommerce-module-product-cart-default") {
    return <CartDefault {...props} />;
  }

  if (props.variant === "me-ecommerce-module-product-checkout-default") {
    return <CheckoutDefault {...props} />;
  }

  return <></>;
}
