import { ISpsComponentBase } from "@sps/ui-adapter";
import { IModel } from "@sps/ecommerce/models/widget/sdk/model";
import { Component as List } from "./list/Component";
import { Component as Overview } from "./overview/Component";

export function Component(
  props: ISpsComponentBase & {
    data: IModel;
    url: string;
    language: string;
    variant: string;
  },
) {
  if (props.variant.startsWith("product-list")) {
    return <List {...props} />;
  }

  if (props.variant.startsWith("product-overview")) {
    return <Overview {...props} />;
  }

  return <></>;
}
