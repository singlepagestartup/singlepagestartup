import type { IComponentPropsExtended } from "./interface";
import { Component as ClientComponent } from "./ClientComponent";

export function Component(props: IComponentPropsExtended) {
  return (
    <ClientComponent
      productId={props.data.id}
      productKind={props.data.kind}
      offerId={props.offerId}
      quantity={props.quantity}
      currencyId={props.billingModuleCurrencyId}
      language={props.language}
      className={props.className}
    />
  );
}
