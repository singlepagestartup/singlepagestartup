import { Component as Default } from "./default/Component";
import { IComponentProps } from "./interface";

export function Component(props: IComponentProps) {
  if (props.variant === "default") {
    return (
      <Default
        isServer={props.isServer}
        language={props.language}
        variant={props.variant}
        data={props.data}
      />
    );
  }

  return <></>;
}
