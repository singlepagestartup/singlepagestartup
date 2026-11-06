import type { IComponentPropsExtended } from "./interface";
import { Component as ClientComponent } from "./ClientComponent";
export function Component(props: IComponentPropsExtended) {
  return (
    <ClientComponent
      isServer={false}
      variant={props.variant}
      data={props.data}
      className={props.className}
      pagesToLayouts={props.pagesToLayouts}
      pagesToMetadata={props.pagesToMetadata}
      pagesToWidgets={props.pagesToWidgets}
    />
  );
}
