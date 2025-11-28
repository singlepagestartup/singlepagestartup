import { Component as ClientAction } from "./ClientAction";
import { IComponentProps } from "./interface";

export function Component(props: IComponentProps) {
  return (
    <ClientAction
      isServer={props.isServer}
      className={props.className}
      language={props.language}
      variant={props.variant}
    />
  );
}
