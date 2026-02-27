import { IComponentPropsExtended } from "./interface";
import { Component as ClientComponent } from "./ClientComponent";

export function Component(props: IComponentPropsExtended) {
  return (
    <ClientComponent
      className={props.className}
      adminBasePath={props.adminBasePath}
      isSettingsView={props.isSettingsView}
    >
      {props.children}
    </ClientComponent>
  );
}
