import { ISpsComponentBase } from "@sps/ui-adapter";
import { IModel } from "@sps/rbac/models/widget/sdk/model";
import { Component as Product } from "./product/Component";

export function Component(
  props: ISpsComponentBase & {
    data: IModel;
    url: string;
    variant: string;
    language: string;
  },
) {
  if (props.variant.startsWith("subject-ecommerce-product")) {
    return (
      <Product
        isServer={props.isServer}
        url={props.url}
        variant={props.variant}
        data={props.data}
        language={props.language}
      />
    );
  }

  return <></>;
}
