import { Component as ClientComponent } from "./ClientComponent";
import { IComponentProps } from "./interface";

export function Component(props: IComponentProps) {
  return (
    <ClientComponent
      isServer={props.isServer}
      product={props.product}
      className={props.className}
      skeleton={props.skeleton}
      billingModuleCurrencyId={props.billingModuleCurrencyId}
      language={props.language}
      store={props.store}
      variant={props.variant}
    />
  );
}
