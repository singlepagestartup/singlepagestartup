import { IComponentProps } from "./interface";
import { Component as Default } from "./default/Component";

export function Component(props: IComponentProps) {
  if (props.variant === "subject-list-default") {
    return <Default {...props} />;
  }

  return <></>;
}
