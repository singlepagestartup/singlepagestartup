import { Component as CardDefault } from "./card-default/Component";
import { IComponentProps } from "./interface";

export function Component(props: IComponentProps) {
  if (props.variant === "article-list-card-default") {
    return <CardDefault {...props} />;
  }

  return <></>;
}
