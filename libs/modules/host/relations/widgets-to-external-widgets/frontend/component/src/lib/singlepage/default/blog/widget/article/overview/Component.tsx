import { Component as WithPrivateContentDefault } from "./with-private-content-default/Component";
import { Component as Default } from "./default/Component";
import { Component as EcommerceModuleProductListCardDefault } from "./ecommerce-module-product-list-default/Component";
import { IComponentProps } from "./interface";

export function Component(props: IComponentProps) {
  if (props.variant === "article-overview-with-private-content-default") {
    return <WithPrivateContentDefault {...props} />;
  }

  if (props.variant === "article-overview-default") {
    return <Default {...props} />;
  }

  if (
    props.variant ===
    "article-overview-ecommerce-module-product-list-card-default"
  ) {
    return <EcommerceModuleProductListCardDefault {...props} />;
  }

  return <></>;
}
