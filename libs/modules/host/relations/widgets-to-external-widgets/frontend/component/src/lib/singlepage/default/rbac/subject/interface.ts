import { IComponentProps as ICrmModuleFormRequestCreateComponentProps } from "./crm-module-form-request-create/interface";
import { IComponentProps as ISocialModuleProfileButtonDefaultComponentProps } from "./social-module-profile-button-default/interface";
import { IComponentProps as IEcommerceProductActionComponentProps } from "./ecommerce-product-action/interface";

export type IComponentProps =
  | ICrmModuleFormRequestCreateComponentProps
  | ISocialModuleProfileButtonDefaultComponentProps
  | IEcommerceProductActionComponentProps;
