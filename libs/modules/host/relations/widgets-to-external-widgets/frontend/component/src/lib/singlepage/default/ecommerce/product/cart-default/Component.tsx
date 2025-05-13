import { Component as RbacSubject } from "../../../rbac/subject/Component";
import { Component as EcommerceModuleProduct } from "@sps/ecommerce/models/product/frontend/component";
import { IComponentProps } from "./interface";

export function Component(props: IComponentProps) {
  return (
    <EcommerceModuleProduct
      isServer={props.isServer}
      variant={props.variant}
      data={props.data}
      language={props.language}
    >
      <RbacSubject
        isServer={props.isServer}
        product={props.data}
        language={props.language}
        variant="me-ecommerce-product-cart-default"
      />
    </EcommerceModuleProduct>
  );
}
