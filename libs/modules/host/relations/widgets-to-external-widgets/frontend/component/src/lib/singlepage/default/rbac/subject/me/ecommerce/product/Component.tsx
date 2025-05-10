import { Component as Action } from "./action/Component";
import { IComponentProps } from "./interface";

export function Component(props: IComponentProps) {
  if (props.variant === "me-ecommerce-product-action") {
    return <Action {...props} />;
  }

  return <></>;
}
