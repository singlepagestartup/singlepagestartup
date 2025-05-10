import { Component as Product } from "./product/Component";
import { IComponentProps } from "./interface";
import { Component as Order } from "./order/Component";
import { Component as Cart } from "./cart/Component";

export function Component(props: IComponentProps) {
  if (props.variant.startsWith("me-ecommerce-product")) {
    return <Product {...(props as any)} />;
  }

  if (props.variant.startsWith("me-ecommerce-order")) {
    return <Order {...(props as any)} />;
  }

  if (props.variant.startsWith("me-ecommerce-cart")) {
    return <Cart {...(props as any)} />;
  }

  return <></>;
}
