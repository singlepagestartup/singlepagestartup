import { IComponentProps as ICrmModuleFormRequestCreateComponentProps } from "./crm-module-form-request-create/interface";
import { IComponentProps as IEcommerceComponentProps } from "./ecommerce/interface";
import { IComponentProps as IAuthenticationMeDefaultComponentProps } from "./authentication/interface";

export type IComponentProps =
  | ICrmModuleFormRequestCreateComponentProps
  | IEcommerceComponentProps
  | IAuthenticationMeDefaultComponentProps;
