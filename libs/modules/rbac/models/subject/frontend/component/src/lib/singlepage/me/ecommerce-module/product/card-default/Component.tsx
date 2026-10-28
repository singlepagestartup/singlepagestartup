import { Component as Subject } from "@sps/rbac/models/subject/frontend/component";
import { Component as EcommerceModuleProduct } from "@sps/ecommerce/models/product/frontend/component";
import type { IComponentPropsExtended } from "./interface";
import { Component as CategoryRowButtonDefault } from "./Category";
import { Component as SocialModuleProfileButtonDefault } from "./Profile";
import { CardContent, CardHeader } from "@sps/shared-ui-shadcn";

export function Component(props: IComponentPropsExtended) {
  return (
    <EcommerceModuleProduct
      isServer={props.isServer}
      variant="default"
      dataSource="props"
      data={props.ecommerceModuleProduct}
      language={props.language}
      topSlot={
        <CardHeader className="p-0">
          <CategoryRowButtonDefault
            isServer={props.isServer}
            language={props.language}
            variant="category-row-button-default"
            ecommerceModuleProduct={props.ecommerceModuleProduct}
          />
        </CardHeader>
      }
      middleSlot={
        <CardContent className="p-0">
          <SocialModuleProfileButtonDefault
            isServer={props.isServer}
            language={props.language}
            variant="social-module-profile-button-default"
            ecommerceModuleProduct={props.ecommerceModuleProduct}
          />
        </CardContent>
      }
    >
      <>
        <Subject
          isServer={props.isServer}
          ecommerceModuleProduct={props.ecommerceModuleProduct}
          ecommerceModuleStore={props.ecommerceModuleStore}
          language={props.language}
          variant="ecommerce-module-product-cart-default"
          dataSource="props"
          data={props.data}
          className="w-full"
        />
        <Subject
          isServer={props.isServer}
          ecommerceModuleProduct={props.ecommerceModuleProduct}
          ecommerceModuleStore={props.ecommerceModuleStore}
          language={props.language}
          variant="ecommerce-module-product-checkout-default"
          dataSource="props"
          data={props.data}
          className="w-full"
        />
      </>
    </EcommerceModuleProduct>
  );
}
