import type { ISpsComponentBase } from "@sps/ui-adapter";
import type { IModel } from "@sps/rbac/models/subject/sdk/model";
import type { IComponentProps as IAuthenticationProps } from "../../../../authentication/me-default/interface";
import type { IModel as IEcommerceModuleProduct } from "@sps/ecommerce/models/product/sdk/model";
export const variant = "me-ecommerce-module-product-card-default" as const;
export interface IComponentProps extends ISpsComponentBase {
  /** authenticationMe supplies the current Subject in client.tsx/server.tsx. */
  apiProps?: IAuthenticationProps["apiProps"];
  variant: typeof variant;
  ecommerceModuleProduct: IEcommerceModuleProduct;
  ecommerceModuleStore?: import("@sps/ecommerce/models/store/sdk/model").IModel;
  language: string;
}
export interface IComponentPropsExtended extends IComponentProps {
  data: IModel;
}
