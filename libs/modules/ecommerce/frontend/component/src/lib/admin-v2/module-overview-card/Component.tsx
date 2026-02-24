import { IComponentPropsExtended } from "./interface";
import { Component as ClientComponent } from "./ClientComponent";

export function Component(props: IComponentPropsExtended) {
  return (
    <ClientComponent
      moduleId={props.moduleId}
      modelName={props.modelName}
      total={props.total}
      href={props.href}
    />
  );
}
