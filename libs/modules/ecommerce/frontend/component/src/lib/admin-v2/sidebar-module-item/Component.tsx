import { IComponentProps } from "./interface";
import { Component as ClientComponent } from "./ClientComponent";

export function Component(props: IComponentProps) {
  return <ClientComponent {...props} />;
}
