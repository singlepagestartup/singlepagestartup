import { ISpsComponentBase } from "@sps/ui-adapter";
import { IModel } from "@sps/ecommerce/models/widget/sdk/model";
import { Component as Default } from "./default/Component";

export function Component(
  props: ISpsComponentBase & {
    language: string;
    data: IModel;
    url: string;
    variant: string;
  },
) {
  if (props.variant === "store-product-list-default") {
    return <Default {...props} />;
  }

  return <></>;
}
