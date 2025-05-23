import { Component as Overview } from "./overview/Component";
import { IComponentProps } from "./interface";

export function Component(props: IComponentProps) {
  if (props.variant.startsWith("category-overview")) {
    return <Overview {...props} />;
  }

  return <></>;
}
