import { Component as Default } from "./default/Component";
import { IComponentProps } from "./interface";

export function Component(props: IComponentProps) {
  if (props.variant === "me-ecommerce-module-cart-default") {
    return <Default {...props} />;
  }

  return <></>;
}
