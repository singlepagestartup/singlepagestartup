import { Component as List } from "./list/Component";
import { IComponentProps } from "./interface";

export function Component(props: IComponentProps) {
  if (props.variant.startsWith("me-ecommerce-order-list")) {
    return <List {...props} />;
  }

  return <></>;
}
