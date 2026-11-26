import type { IComponentProps } from "./interface";
import { Component as ClientComponent } from "./ClientComponent";
export function Component(props: IComponentProps) {
  return (
    <ClientComponent
      isServer={false}
      variant={props.variant}
      language={props.language}
      settingsSelected={props.settingsSelected}
    />
  );
}
