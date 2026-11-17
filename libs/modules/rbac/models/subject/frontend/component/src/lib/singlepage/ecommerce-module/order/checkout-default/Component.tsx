import { IComponentPropsExtended } from "./interface";
import { Component as ClientComponent } from "./ClientComponent";

export function Component(props: IComponentPropsExtended) {
  return (
    <ClientComponent
      key={props.data.id}
      isServer={props.isServer}
      variant={props.variant}
      data={props.data}
      language={props.language}
      disabled={props.disabled}
      ecommerceModuleProduct={props.ecommerceModuleProduct}
      ecommerceModuleOrder={props.ecommerceModuleOrder}
      ecommerceModuleStore={props.ecommerceModuleStore}
    />
  );
}
