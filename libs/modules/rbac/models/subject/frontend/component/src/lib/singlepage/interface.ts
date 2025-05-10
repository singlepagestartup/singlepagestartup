import { IComponentProps as ISocialModuleProfilesListDefaultComponentProps } from "./social-module/profile/list/default/interface";
import { IComponentProps as IFindComponentProps } from "./find/interface";
import { IComponentProps as IAdminTableRowComponentProps } from "./admin/table-row/interface";
import { IComponentProps as IAdminTableComponentProps } from "./admin/table/interface";
import { IComponentProps as IAdminSelectInputComponentProps } from "./admin/select-input/interface";
import { IComponentProps as IAdminFormComponentProps } from "./admin/form/interface";
import { IComponentProps as IAuthenticationInitDefaultComponentProps } from "./authentication/init-default/interface";
import { IComponentProps as IAuthenticationEmailAndPasswordAuthenticationFormDefaultComponentProps } from "./authentication/email-and-password/authentication-form-default/interface";
import { IComponentProps as IAuthenticationLogoutActionComponentProps } from "./authentication/logout-action-default/interface";
import { IComponentProps as IAuthenticationLogoutButtonComponentProps } from "./authentication/logout-button-default/interface";
import { IComponentProps as IAuthenticationIsAllowedWrapperComponentProps } from "./authentication/is-authorized-wrapper-default/interface";
import { IComponentProps as IAuthenticationSelectMethodComponentProps } from "./authentication/select-method-default/interface";
import { IComponentProps as IAuthenticationEthereumVirtualMachineComponentProps } from "./authentication/ethereum-virtual-machine-default/interface";
import { IComponentProps as IAuthenticationMeComponentProps } from "./authentication/me-default/interface";
import { IComponentProps as IAuthenticationEmailAndPasswordForgotPasswordComponentProps } from "./authentication/email-and-password/forgot-password-form-default/interface";
import { IComponentProps as IAuthenticationEmailAndPasswordResetPasswordComponentProps } from "./authentication/email-and-password/reset-password-form-default/interface";
import { IComponentProps as IAuthenticationEmailAndPasswordRegistrationFormDefaultComponentProps } from "./authentication/email-and-password/registration-form-default/interface";
import { IComponentProps as IDefaultComponentProps } from "./default/interface";
import { IComponentProps as IIdentityGetEmailsComponentProps } from "./identity/get-emails/interface";
import { IComponentProps as IEcommerceModuleProductCheckoutDefaultComponentProps } from "./ecommerce-module/product/checkout-default/interface";
import { IComponentProps as IEcommerceModuleProductCartComponentProps } from "./ecommerce-module/product/cart/interface";
import { IComponentProps as IProfileButtonDefaultComponentProps } from "./profile-button-default/interface";
import { IComponentProps as IOverviewDefaultComponentProps } from "./overview-default/interface";
import { IComponentProps as IIdentitySettingsDefaultComponentProps } from "./identity/settings-default/interface";
import { IComponentProps as ICrmModuleFormRequestCreateComponentProps } from "./crm-module/form/request/create/interface";
import { IComponentProps as IEcommerceModuleOrderTotalDefaultComponentProps } from "./ecommerce-module/order/total-default/interface";
import { IComponentProps as IEcommerceModuleOrderQuantityDefaultComponentProps } from "./ecommerce-module/order/quantity-default/interface";

export type IComponentProps =
  | ISocialModuleProfilesListDefaultComponentProps
  | IFindComponentProps
  | IAdminTableRowComponentProps
  | IAdminTableComponentProps
  | IAdminSelectInputComponentProps
  | IAdminFormComponentProps
  | IDefaultComponentProps
  | IEcommerceModuleProductCheckoutDefaultComponentProps
  | IProfileButtonDefaultComponentProps
  | IOverviewDefaultComponentProps
  | IEcommerceModuleProductCartComponentProps
  | IAuthenticationInitDefaultComponentProps
  | IAuthenticationEmailAndPasswordAuthenticationFormDefaultComponentProps
  | IAuthenticationLogoutActionComponentProps
  | IAuthenticationLogoutButtonComponentProps
  | IAuthenticationIsAllowedWrapperComponentProps
  | IAuthenticationSelectMethodComponentProps
  | IAuthenticationEthereumVirtualMachineComponentProps
  | IAuthenticationMeComponentProps
  | IIdentityGetEmailsComponentProps
  | IIdentitySettingsDefaultComponentProps
  | IAuthenticationEmailAndPasswordForgotPasswordComponentProps
  | IAuthenticationEmailAndPasswordResetPasswordComponentProps
  | IAuthenticationEmailAndPasswordRegistrationFormDefaultComponentProps
  | ICrmModuleFormRequestCreateComponentProps
  | IEcommerceModuleOrderTotalDefaultComponentProps
  | IEcommerceModuleOrderQuantityDefaultComponentProps
  | never;
