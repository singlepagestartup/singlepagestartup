import { IComponentProps as ICrmModuleFormRequestCreateComponentProps } from "./crm-module-form-request-create/interface";
import { IComponentProps as IEcommerceProductActionComponentProps } from "./ecommerce-product-action/interface";
import { IComponentProps as IAuthenticationMeDefaultComponentProps } from "./authentication/interface";

export type IComponentProps =
  | ICrmModuleFormRequestCreateComponentProps
  | IEcommerceProductActionComponentProps
  | IAuthenticationMeDefaultComponentProps;
