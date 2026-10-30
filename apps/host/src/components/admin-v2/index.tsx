import { Component as ClientComponent } from "./ClientComponent";
import { IComponentProps } from "./interface";

export function Component(props: IComponentProps) {
  return (
    <ClientComponent
      url={props.url}
      language={props.language}
      className={props.className}
    />
  );
}
