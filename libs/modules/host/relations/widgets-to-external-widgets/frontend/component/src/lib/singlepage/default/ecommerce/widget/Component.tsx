import { Component as EcommerceWidget } from "@sps/ecommerce/models/widget/frontend/component";
import { Component as Store } from "./store/Component";
import { Component as Category } from "./category/Component";
import { Component as Product } from "./product/Component";
import { IModel } from "@sps/ecommerce/models/widget/sdk/model";
import { ISpsComponentBase } from "@sps/ui-adapter";

export function Component(
  props: ISpsComponentBase & {
    language: string;
    data: IModel;
    url: string;
  },
) {
  return (
    <EcommerceWidget
      isServer={props.isServer}
      variant={props.data.variant as any}
      data={props.data}
      language={props.language}
    >
      {props.data.variant.startsWith("product") ? (
        <Product
          url={props.url}
          isServer={props.isServer}
          data={props.data}
          language={props.language}
          variant={props.data.variant}
        />
      ) : null}
      {props.data.variant.startsWith("category") ? (
        <Category
          url={props.url}
          isServer={props.isServer}
          data={props.data}
          language={props.language}
        />
      ) : null}
      {props.data.variant.startsWith("store") ? (
        <Store
          isServer={props.isServer}
          data={props.data}
          language={props.language}
          url={props.url}
          variant={props.data.variant}
        />
      ) : null}
    </EcommerceWidget>
  );
}
