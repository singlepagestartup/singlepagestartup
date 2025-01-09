import { IComponentProps as IFindComponentProps } from "./find/interface";
import { IComponentProps as IAdminTableRowComponentProps } from "./admin/table-row/interface";
import { IComponentProps as IAdminTableComponentProps } from "./admin/table/interface";
import { IComponentProps as IAdminSelectInputComponentProps } from "./admin/select-input/interface";
import { IComponentProps as IAdminFormComponentProps } from "./admin/form/interface";
import { IComponentProps as IDefaultComponentProps } from "./default/interface";
import { IComponentProps as IInitComponentProps } from "./authentication/init-default/interface";
import { IComponentProps as ILoginAndPasswordComponentProps } from "./authentication/login-and-password/authentication-form-default/interface";
import { IComponentProps as ILogoutActionComponentProps } from "./authentication/logout-action-default/interface";
import { IComponentProps as ILogoutButtonComponentProps } from "./authentication/logout-button-default/interface";
import { IComponentProps as IIsAllowedWrapperComponentProps } from "./authentication/is-authorized-wrapper-default/interface";
import { IComponentProps as ISelectMethodComponentProps } from "./authentication/select-method-default/interface";
import { IComponentProps as IEthereumVirtualMachineComponentProps } from "./authentication/ethereum-virtual-machine-default/interface";
import { IComponentProps as IMeComponentProps } from "./authentication/me-default/interface";
import { IComponentProps as IGetEmailsComponentProps } from "./identities/get-emails/interface";
import { IComponentProps as IEcommerceProductCheckoutComponentProps } from "./ecommerce/product-checkout/interface";
import { IComponentProps as IEcommerceProductCartComponentProps } from "./ecommerce/product-cart/interface";
import { IComponentProps as IProfileButtonDefaultComponentProps } from "./profile-button-default/interface";
import { IComponentProps as IOverviewDefaultComponentProps } from "./overview-default/interface";
import { IComponentProps as IIdentitiesUpdateDefaultComponentProps } from "./identities/update-default/interface";
import { IComponentProps as IIdentitiesCreateDefaultComponentProps } from "./identities/create-default/interface";
import { IComponentProps as IForgotPasswordComponentProps } from "./authentication/login-and-password/forgot-password-form-default/interface";
import { IComponentProps as IResetPasswordComponentProps } from "./authentication/login-and-password/reset-password-form-default/interface";

export type IComponentProps =
  | IFindComponentProps
  | IAdminTableRowComponentProps
  | IAdminTableComponentProps
  | IAdminSelectInputComponentProps
  | IAdminFormComponentProps
  | IDefaultComponentProps
  | IInitComponentProps
  | ILoginAndPasswordComponentProps
  | ILogoutActionComponentProps
  | ILogoutButtonComponentProps
  | IIsAllowedWrapperComponentProps
  | ISelectMethodComponentProps
  | IEthereumVirtualMachineComponentProps
  | IMeComponentProps
  | IGetEmailsComponentProps
  | IEcommerceProductCheckoutComponentProps
  | IProfileButtonDefaultComponentProps
  | IOverviewDefaultComponentProps
  | IIdentitiesUpdateDefaultComponentProps
  | IIdentitiesCreateDefaultComponentProps
  | IEcommerceProductCartComponentProps
  | IForgotPasswordComponentProps
  | IResetPasswordComponentProps
  | never;
