import { ISpsComponentBase } from "@sps/ui-adapter";
import { Component as Default } from "./default/Component";
import { IModel } from "@sps/ecommerce/models/widget/sdk/model";

export function Component(
  props: ISpsComponentBase & {
    url: string;
    language: string;
    variant: string;
    data: IModel;
  },
) {
  if (props.variant === "product-list-default") {
    return <Default {...props} />;
  }

  return <></>;
}
