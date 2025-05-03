import { ISpsComponentBase } from "@sps/ui-adapter";
import { IModel } from "@sps/ecommerce/models/widget/sdk/model";
import { Component as CardDefault } from "./card-default/Component";

export function Component(
  props: ISpsComponentBase & {
    language: string;
    data: IModel;
    url: string;
    variant: string;
  },
) {
  if (props.variant === "store-product-list-card-default") {
    return <CardDefault {...props} />;
  }

  return <></>;
}
