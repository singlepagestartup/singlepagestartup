import { ISpsComponentBase } from "@sps/ui-adapter";
import { IModel } from "@sps/ecommerce/models/widget/sdk/model";
import { Component as ListDefault } from "./list-default/Component";

export function Component(
  props: ISpsComponentBase & {
    data: IModel;
    language: string;
  },
) {
  if (props.data.variant === "store-product-list-default") {
    return (
      <ListDefault
        isServer={props.isServer}
        language={props.language}
        data={props.data}
      />
    );
  }

  return <></>;
}
