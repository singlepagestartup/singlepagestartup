import { Component as ChildComponent } from "./Component";
import { Component as ClientComponent } from "./ClientComponent";
import { IComponentProps } from "./interface";

export function Component(props: IComponentProps) {
  return (
    <ClientComponent>
      <ChildComponent {...props} />
    </ClientComponent>
  );
}
