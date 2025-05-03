import { ISpsComponentBase } from "@sps/ui-adapter";
import { IModel } from "@sps/blog/models/widget/sdk/model";
import { Component as WithPrivateContentDefault } from "./with-private-content-default/Component";
import { Component as Default } from "./default/Component";
import { Component as EcommerceProductListDefault } from "./ecommerce-product-list-default/Component";

export function Component(
  props: ISpsComponentBase & {
    data: IModel;
    url: string;
    language: string;
  },
) {
  if (props.data.variant === "article-overview-with-private-content-default") {
    return <WithPrivateContentDefault {...props} />;
  }

  if (props.data.variant === "article-overview-default") {
    return <Default {...props} />;
  }

  if (
    props.data.variant === "article-overview-ecommerce-product-list-default"
  ) {
    return <EcommerceProductListDefault {...props} />;
  }

  return <></>;
}
