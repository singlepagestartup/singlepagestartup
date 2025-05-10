import { Component as ClientComponent } from "./ClientComponent";
import { IComponentProps } from "./interface";

export function Component(props: IComponentProps) {
  return (
    <ClientComponent
      isServer={props.isServer}
      className={props.className}
      language={props.language}
      variant={props.variant}
    />
  );
}
