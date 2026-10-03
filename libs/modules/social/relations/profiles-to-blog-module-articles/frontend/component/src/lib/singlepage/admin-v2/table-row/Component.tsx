import { IComponentPropsExtended } from "./interface";
import { Component as ClientComponent } from "./ClientComponent";

export function Component(props: IComponentPropsExtended) {
  return (
    <ClientComponent
      isServer={false}
      skeleton={props.skeleton}
      variant={props.variant}
      data={props.data}
      apiProps={props.apiProps}
      className={props.className}
      module={props.module}
      name={props.name}
      type={props.type}
      adminForm={props.adminForm}
      leftModelAdminForm={props.leftModelAdminForm}
      rightModelAdminForm={props.rightModelAdminForm}
      leftModelAdminFormLabel={props.leftModelAdminFormLabel}
      rightModelAdminFormLabel={props.rightModelAdminFormLabel}
      relatedAdminForm={props.relatedAdminForm}
    />
  );
}
