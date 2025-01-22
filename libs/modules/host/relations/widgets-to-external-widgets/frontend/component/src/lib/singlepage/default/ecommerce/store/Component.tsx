import { ISpsComponentBase } from "@sps/ui-adapter";
import { IModel } from "@sps/ecommerce/models/widget/sdk/model";
import { Component as ListDefault } from "./list-default/Component";

export function Component(
  props: ISpsComponentBase & {
    data: IModel;
  },
) {
  if (props.data.variant === "store-list-default") {
    return <ListDefault isServer={props.isServer} />;
  }

  return <></>;
}
