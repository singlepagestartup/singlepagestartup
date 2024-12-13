import { Component as ClientComponent } from "./ClientComponent";
import { IModel as IProduct } from "@sps/ecommerce/models/product/sdk/model";
import { ISpsComponentBase } from "@sps/ui-adapter";

export function Component(
  props: ISpsComponentBase & {
    product: IProduct;
  },
) {
  return (
    <ClientComponent
      isServer={props.isServer}
      hostUrl={props.hostUrl}
      product={props.product}
      className={props.className}
      skeleton={props.skeleton}
    />
  );
}
