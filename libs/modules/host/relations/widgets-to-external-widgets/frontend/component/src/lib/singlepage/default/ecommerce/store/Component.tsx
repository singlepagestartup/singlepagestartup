import { ISpsComponentBase } from "@sps/ui-adapter";
import { IModel } from "@sps/ecommerce/models/widget/sdk/model";
import { Component as ListDefault } from "./list-default/Component";
import { Component as Product } from "./product/Component";

export function Component(
  props: ISpsComponentBase & {
    data: IModel;
    language: string;
  },
) {
  if (props.data.variant.startsWith("store-product-")) {
    return (
      <Product
        isServer={props.isServer}
        language={props.language}
        data={props.data}
      />
    );
  }

  if (props.data.variant === "store-list-default") {
    return <ListDefault isServer={props.isServer} language={props.language} />;
  }

  return <></>;
}
