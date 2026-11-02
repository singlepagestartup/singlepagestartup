import { IComponentPropsExtended } from "./interface";
import { Component as ClientComponent } from "./ClientComponent";

export function Component(props: IComponentPropsExtended) {
  return (
    <ClientComponent
      isServer={props.isServer}
      variant={props.variant}
      data={props.data}
      ecommerceModuleProduct={props.ecommerceModuleProduct}
      className={props.className}
      ecommerceModuleStore={props.ecommerceModuleStore}
      language={props.language}
    />
  );
}
