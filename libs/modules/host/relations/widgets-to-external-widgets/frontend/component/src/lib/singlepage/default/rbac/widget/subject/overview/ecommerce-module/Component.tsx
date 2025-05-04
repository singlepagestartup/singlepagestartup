import { IComponentProps } from "./interface";
import { Component as Product } from "./product/Component";

export function Component(props: IComponentProps) {
  if (props.variant.startsWith("subject-overview-ecommerce-module-product")) {
    return <Product {...props} />;
  }

  return <></>;
}
