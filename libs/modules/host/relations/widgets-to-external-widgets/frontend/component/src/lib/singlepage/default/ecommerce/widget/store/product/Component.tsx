import { ISpsComponentBase } from "@sps/ui-adapter";
import { IModel } from "@sps/ecommerce/models/widget/sdk/model";
import { Component as List } from "./list/Component";

export function Component(
  props: ISpsComponentBase & {
    url: string;
    data: IModel;
    language: string;
    variant: string;
  },
) {
  if (props.data.variant.startsWith("store-product-list")) {
    return (
      <List
        isServer={props.isServer}
        language={props.language}
        data={props.data}
        url={props.url}
        variant={props.data.variant}
      />
    );
  }

  return <></>;
}
