import { ISpsComponentBase } from "@sps/ui-adapter";
import { IModel } from "@sps/ecommerce/models/widget/sdk/model";
import { Component as Default } from "./default/Component";

export function Component(
  props: ISpsComponentBase & {
    data: IModel;
    url: string;
    language: string;
    variant: string;
  },
) {
  if (props.variant === "product-overview-default") {
    return <Default {...props} />;
  }

  return <></>;
}
