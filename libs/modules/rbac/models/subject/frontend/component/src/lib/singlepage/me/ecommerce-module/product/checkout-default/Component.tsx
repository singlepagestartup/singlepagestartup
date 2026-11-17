import { IComponentPropsExtended } from "./interface";
import { Component as ClientComponent } from "./ClientComponent";

export function Component(props: IComponentPropsExtended) {
  return (
    <ClientComponent
      key={`${props.data.id}:${props.ecommerceModuleProduct.id}:${props.ecommerceModuleStore?.id ?? ""}`}
      isServer={props.isServer}
      variant={props.variant}
      className={props.className}
      ecommerceModuleProduct={props.ecommerceModuleProduct}
      data={props.data}
      language={props.language}
      ecommerceModuleStore={props.ecommerceModuleStore}
      purchaseConfiguration={props.purchaseConfiguration}
      hideWhenIdle={props.hideWhenIdle}
      onQuoteStale={props.onQuoteStale}
    />
  );
}
