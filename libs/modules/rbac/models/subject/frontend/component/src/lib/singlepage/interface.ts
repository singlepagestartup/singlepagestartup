import { IComponentProps as IEcommerceModuleOrderCheckoutDefaultComponentProps } from "./ecommerce-module/order/checkout-default/interface";
import { IComponentProps as IEcommerceModuleOrderListCheckoutDefaultComponentProps } from "./ecommerce-module/order/list/checkout-default/interface";
import { IComponentProps as IEcommerceModuleOrderUpdateDefaultComponentProps } from "./ecommerce-module/order/update-default/interface";
import { IComponentProps as IEcommerceModuleOrderCreateDefaultComponentProps } from "./ecommerce-module/order/create-default/interface";
import { IComponentProps as IEcommerceModuleOrderDeleteDefaultComponentProps } from "./ecommerce-module/order/delete-default/interface";
import { IComponentProps as ISocialModuleProfileListOverviewDefaultComponentProps } from "./social-module/profile/list/overview-default/interface";
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
import { IComponentProps as IEcommerceModuleProductCartDefaultComponentProps } from "./ecommerce-module/product/cart-default/interface";
import { IComponentProps as IAuthenticationButtonDefaultComponentProps } from "./authentication/button-default/interface";
import { IComponentProps as IOverviewDefaultComponentProps } from "./overview-default/interface";
import { IComponentProps as IIdentitySettingsDefaultComponentProps } from "./identity/settings-default/interface";
import { IComponentProps as IEcommerceModuleOrderListTotalDefaultComponentProps } from "./ecommerce-module/order/list/total-default/interface";
import { IComponentProps as IEcommerceModuleOrderListQuantityDefaultComponentProps } from "./ecommerce-module/order/list/quantity-default/interface";
import { IComponentProps as IEcommerceModuleOrderListDefaultComponentProps } from "./ecommerce-module/order/list/default/interface";

import { IComponentProps as ICrmModuleFormRequestCreateComponentProps } from "./crm-module/form/request/create/interface";
import { IComponentProps as ISocialModuleProfileChatListDefaultComponentProps } from "./social-module/profile/chat/list/default/interface";
import { IComponentProps as ISocialModuleProfileChatOverviewDefaultComponentProps } from "./social-module/profile/chat/overview/default/interface";

export type IComponentProps =
  | IEcommerceModuleOrderCheckoutDefaultComponentProps
  | IEcommerceModuleOrderListCheckoutDefaultComponentProps
  | IEcommerceModuleOrderUpdateDefaultComponentProps
  | IEcommerceModuleOrderCreateDefaultComponentProps
  | IEcommerceModuleOrderDeleteDefaultComponentProps
  | ISocialModuleProfileListOverviewDefaultComponentProps
  | IFindComponentProps
  | IAdminTableRowComponentProps
  | IAdminTableComponentProps
  | IAdminSelectInputComponentProps
  | IAdminFormComponentProps
  | IDefaultComponentProps
  | IEcommerceModuleProductCheckoutDefaultComponentProps
  | IAuthenticationButtonDefaultComponentProps
  | IOverviewDefaultComponentProps
  | IEcommerceModuleProductCartDefaultComponentProps
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
  | IEcommerceModuleOrderListTotalDefaultComponentProps
  | IEcommerceModuleOrderListQuantityDefaultComponentProps
  | IEcommerceModuleOrderListDefaultComponentProps
  | ISocialModuleProfileChatListDefaultComponentProps
  | ISocialModuleProfileChatOverviewDefaultComponentProps
  | never;
