import { Component as Subject } from "@sps/rbac/models/subject/frontend/component";
import { Component as EcommerceModuleProduct } from "@sps/ecommerce/models/product/frontend/component";
import type { IComponentPropsExtended } from "./interface";

export function Component(props: IComponentPropsExtended) {
  return (
    <EcommerceModuleProduct
      isServer={props.isServer}
      variant="cart-default"
      dataSource="props"
      data={props.ecommerceModuleProduct}
      language={props.language}
    >
      <Subject
        isServer={props.isServer}
        ecommerceModuleProduct={props.ecommerceModuleProduct}
        language={props.language}
        variant="me-ecommerce-module-product-cart-default"
        dataSource="props"
        data={props.data}
      />
    </EcommerceModuleProduct>
  );
}
