import { IComponentPropsExtended } from "./interface";
import { Component as ClientComponent } from "./ClientComponent";

export function Component(props: IComponentPropsExtended) {
  return (
    <ClientComponent
      isServer={false}
      variant={props.variant}
      data={props.data}
      className={props.className}
      apiProps={props.apiProps}
      widgetsToWebsiteBuilderModuleWidgets={
        props.widgetsToWebsiteBuilderModuleWidgets
      }
      widgetsToCrmModuleWidgets={props.widgetsToCrmModuleWidgets}
      widgetsToEcommerceModuleWidgets={props.widgetsToEcommerceModuleWidgets}
    />
  );
}
