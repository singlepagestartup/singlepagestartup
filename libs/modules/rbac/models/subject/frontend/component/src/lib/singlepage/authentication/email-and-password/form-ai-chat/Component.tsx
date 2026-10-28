import { Component as ClientComponent } from "./ClientComponent";
import type { IComponentProps } from "./interface";

export function Component(props: IComponentProps) {
  return (
    <ClientComponent
      language={props.language}
      isServer={props.isServer}
      variant={props.variant}
      mode={props.mode}
    />
  );
}
