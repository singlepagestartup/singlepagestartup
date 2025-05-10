import { Component as Product } from "./product/Component";
import { IComponentProps } from "./interface";
import { Component as Order } from "./order/Component";

export function Component(props: IComponentProps) {
  if (props.variant.startsWith("me-ecommerce-product")) {
    return <Product {...(props as any)} />;
  }

  if (props.variant.startsWith("me-ecommerce-order")) {
    return <Order {...(props as any)} />;
  }

  return <></>;
}
