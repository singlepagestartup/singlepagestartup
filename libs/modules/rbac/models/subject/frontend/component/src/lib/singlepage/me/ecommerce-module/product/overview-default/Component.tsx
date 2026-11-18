import { Component as Subject } from "@sps/rbac/models/subject/frontend/component";
import { ProductWithOfferPrice } from "../../../../ecommerce-module/order/create-default/ProductWithOfferPrice";
import type { IComponentPropsExtended } from "./interface";
import { CardContent, CardHeader } from "@sps/shared-ui-shadcn";

export function Component(props: IComponentPropsExtended) {
  return (
    <ProductWithOfferPrice
      isServer={props.isServer}
      variant="overview-default"
      product={props.ecommerceModuleProduct}
      storeId={props.ecommerceModuleStore?.id}
      language={props.language}
      topSlot={
        <CardHeader className="p-0">
          <Subject
            isServer={props.isServer}
            language={props.language}
            variant="ecommerce-module-product-category-default"
            ecommerceModuleProductId={props.ecommerceModuleProduct.id}
          />
        </CardHeader>
      }
      middleSlot={
        <CardContent className="p-0">
          <Subject
            isServer={props.isServer}
            language={props.language}
            variant="ecommerce-module-product-profile-default"
            ecommerceModuleProductId={props.ecommerceModuleProduct.id}
          />
        </CardContent>
      }
    >
      <div className="grid min-w-0 gap-4">
        <Subject
          isServer={props.isServer}
          ecommerceModuleProduct={props.ecommerceModuleProduct}
          ecommerceModuleStore={props.ecommerceModuleStore}
          language={props.language}
          variant="me-ecommerce-module-product-cart-default"
          withOneStepCheckout
          dataSource="props"
          data={props.data}
          className="w-full"
        />
      </div>
    </ProductWithOfferPrice>
  );
}
