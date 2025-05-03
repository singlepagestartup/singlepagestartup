import { ISpsComponentBase } from "@sps/ui-adapter";
import { IModel } from "@sps/rbac/models/widget/sdk/model";
import { Component as Default } from "./card-default/Component";

export function Component(
  props: ISpsComponentBase & {
    url: string;
    data: IModel;
    variant: string;
    language: string;
  },
) {
  if (props.variant === "subject-ecommerce-product-list-card-default") {
    return (
      <Default
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
