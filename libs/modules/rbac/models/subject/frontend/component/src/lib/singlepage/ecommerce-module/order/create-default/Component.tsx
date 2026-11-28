import { IComponentPropsExtended } from "./interface";
import { Component as ClientComponent } from "./ClientComponent";

export function Component(props: IComponentPropsExtended) {
  return (
    <ClientComponent
      isServer={props.isServer}
      variant={props.variant}
      data={props.data}
      language={props.language}
      billingModule={props.billingModule}
      className={props.className}
      ecommerceModuleProduct={props.ecommerceModuleProduct}
      ecommerceModuleStore={props.ecommerceModuleStore}
      ecommerceModuleOfferId={props.ecommerceModuleOfferId}
      openServiceDiscussionOnSubmit={props.openServiceDiscussionOnSubmit}
      excludedOfferIds={props.excludedOfferIds}
      hideConfiguration={props.hideConfiguration}
      checkoutSlot={props.checkoutSlot}
    />
  );
}
