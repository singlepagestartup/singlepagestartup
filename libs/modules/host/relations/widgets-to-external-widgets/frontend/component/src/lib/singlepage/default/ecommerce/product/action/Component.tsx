import { Component as ClientComponent } from "./ClientComponent";
import { IModel as IProduct } from "@sps/ecommerce/models/product/sdk/model";
import { IModel as IStore } from "@sps/ecommerce/models/store/sdk/model";
import { ISpsComponentBase } from "@sps/ui-adapter";

export function Component(
  props: ISpsComponentBase & {
    product: IProduct;
    store: IStore;
    billingModuleCurrencyId?: string;
    language: string;
  },
) {
  return (
    <ClientComponent
      isServer={props.isServer}
      product={props.product}
      className={props.className}
      skeleton={props.skeleton}
      billingModuleCurrencyId={props.billingModuleCurrencyId}
      language={props.language}
      store={props.store}
    />
  );
}
