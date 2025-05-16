import { Component as RbacSubject } from "../../../rbac/subject/Component";
import { Component as EcommerceModuleProduct } from "@sps/ecommerce/models/product/frontend/component";
import { IComponentProps } from "./interface";
import { Component as CategoryRowButtonDefault } from "../category-row-button-default/Component";
import { Component as RbacModuleSubjectProfileButtonDefault } from "../rbac-module-subject-profile-button-default/Component";
import { CardContent, CardHeader } from "@sps/shared-ui-shadcn";

export function Component(props: IComponentProps) {
  return (
    <EcommerceModuleProduct
      isServer={props.isServer}
      variant="overview-default"
      data={props.data}
      language={props.language}
      topSlot={
        <CardHeader className="pb-0">
          <CategoryRowButtonDefault
            isServer={props.isServer}
            language={props.language}
            variant={props.variant}
            data={props.data}
          />
        </CardHeader>
      }
      middleSlot={
        <CardContent>
          <RbacModuleSubjectProfileButtonDefault
            isServer={props.isServer}
            language={props.language}
            variant={props.variant}
            data={props.data}
          />
        </CardContent>
      }
    >
      <RbacSubject
        isServer={props.isServer}
        product={props.data}
        language={props.language}
        variant="me-ecommerce-module-product-cart-default"
      />
    </EcommerceModuleProduct>
  );
}
