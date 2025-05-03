import { ISpsComponentBase } from "@sps/ui-adapter";
import { IModel } from "@sps/rbac/models/widget/sdk/model";
import { Component as List } from "./list/Component";

export function Component(
  props: ISpsComponentBase & {
    data: IModel;
    url: string;
    variant: string;
    language: string;
  },
) {
  if (props.variant.startsWith("subject-ecommerce-product-list")) {
    return (
      <List
        isServer={props.isServer}
        url={props.url}
        data={props.data}
        variant={props.variant}
        language={props.language}
      />
    );
  }

  return <></>;
}
