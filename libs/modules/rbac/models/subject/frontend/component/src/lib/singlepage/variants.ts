import { Component as EcommerceModuleOrderCheckoutDefault } from "./ecommerce-module/order/checkout-default";
import { Component as EcommerceModuleOrderListCheckoutDefault } from "./ecommerce-module/order/list/checkout-default";
import { Component as EcommerceModuleOrderUpdateDefault } from "./ecommerce-module/order/update-default";
import { Component as EcommerceModuleOrderCreateDefault } from "./ecommerce-module/order/create-default";
import { Component as EcommerceModuleOrderDeleteDefault } from "./ecommerce-module/order/delete-default";
import { Component as SocialModuleProfileListOverviewDefault } from "./social-module/profile/list/overview-default";
import { Component as Find } from "./find";
import { Component as AdminTableRow } from "./admin/table-row";
import { Component as AdminTable } from "./admin/table";
import { Component as AdminSelectInput } from "./admin/select-input";
import { Component as AdminForm } from "./admin/form";
import { Component as Default } from "./default";
import { Component as AuthenticationInitDefault } from "./authentication/init-default";
import { Component as AuthenticationEmailAndPasswordAuthenticationFormDefault } from "./authentication/email-and-password/authentication-form-default";
import { Component as AuthenticationEmailAndPasswordRegistrationFormDefault } from "./authentication/email-and-password/registration-form-default";
import { Component as AuthenticationLogoutActionDefault } from "./authentication/logout-action-default";
import { Component as AuthenticationLogoutButtonDefault } from "./authentication/logout-button-default";
import { Component as AuthenticationIsAllowedWrapperDefault } from "./authentication/is-authorized-wrapper-default";
import { Component as AuthenticationSelectMethodDefault } from "./authentication/select-method-default";
import { Component as AuthenticationEthereumVirtualMachineDefault } from "./authentication/ethereum-virtual-machine-default";
import { Component as AuthenticationMeDefault } from "./authentication/me-default";
import { Component as GetEmails } from "./identity/get-emails";
import { Component as EcommerceModuleProductCheckoutDefault } from "./ecommerce-module/product/checkout-default";
import { Component as EcommerceModuleProductCartDefault } from "./ecommerce-module/product/cart-default";
import { Component as AuthenticationButtonDefault } from "./authentication/button-default";
import { Component as OverviewDefault } from "./overview-default";
import { Component as IdentityUpdateDefault } from "./identity/settings-default";
import { Component as AuthenticationEmailAndPasswordForgotPasswordFormDefault } from "./authentication/email-and-password/forgot-password-form-default";
import { Component as AuthenticationEmailAndPasswordResetPasswordFormDefault } from "./authentication/email-and-password/reset-password-form-default";
import { Component as CrmModuleFormRequestCreate } from "./crm-module/form/request/create";
import { Component as EcommerceModuleOrderListTotalDefault } from "./ecommerce-module/order/list/total-default";
import { Component as EcommerceModuleOrderListQuantityDefault } from "./ecommerce-module/order/list/quantity-default";
import { Component as EcommerceModuleOrderListDefault } from "./ecommerce-module/order/list/default";
import { Component as SocialModuleProfileChatListDefault } from "./social-module/profile/chat/list/default";

export const variants = {
  "ecommerce-module-order-checkout-default":
    EcommerceModuleOrderCheckoutDefault,
  "ecommerce-module-order-list-checkout-default":
    EcommerceModuleOrderListCheckoutDefault,
  "ecommerce-module-order-update-default": EcommerceModuleOrderUpdateDefault,
  "ecommerce-module-order-create-default": EcommerceModuleOrderCreateDefault,
  "ecommerce-module-order-delete-default": EcommerceModuleOrderDeleteDefault,
  "social-module-profile-list-overview-default":
    SocialModuleProfileListOverviewDefault,
  find: Find,
  "admin-table-row": AdminTableRow,
  "admin-table": AdminTable,
  "admin-select-input": AdminSelectInput,
  "admin-form": AdminForm,
  default: Default,
  "authentication-init-default": AuthenticationInitDefault,
  "authentication-email-and-password-authentication-form-default":
    AuthenticationEmailAndPasswordAuthenticationFormDefault,
  "authentication-logout-action-default": AuthenticationLogoutActionDefault,
  "authentication-logout-button-default": AuthenticationLogoutButtonDefault,
  "authentication-is-authorized-wrapper-default":
    AuthenticationIsAllowedWrapperDefault,
  "authentication-select-method-default": AuthenticationSelectMethodDefault,
  "authentication-ethereum-virtual-machine-default":
    AuthenticationEthereumVirtualMachineDefault,
  "authentication-me-default": AuthenticationMeDefault,
  "authentication-email-and-password-forgot-password-form-default":
    AuthenticationEmailAndPasswordForgotPasswordFormDefault,
  "authentication-email-and-password-reset-password-form-default":
    AuthenticationEmailAndPasswordResetPasswordFormDefault,
  "authentication-email-and-password-registration-form-default":
    AuthenticationEmailAndPasswordRegistrationFormDefault,
  "identity-settings-default": IdentityUpdateDefault,
  "ecommerce-module-product-checkout-default":
    EcommerceModuleProductCheckoutDefault,
  "ecommerce-module-product-cart-default": EcommerceModuleProductCartDefault,
  "get-emails": GetEmails,
  "authentication-button-default": AuthenticationButtonDefault,
  "overview-default": OverviewDefault,
  "crm-module-form-request-create": CrmModuleFormRequestCreate,
  "ecommerce-module-order-list-total-default":
    EcommerceModuleOrderListTotalDefault,
  "ecommerce-module-order-list-quantity-default":
    EcommerceModuleOrderListQuantityDefault,
  "ecommerce-module-order-list-default": EcommerceModuleOrderListDefault,
  "social-module-profile-chat-list-default": SocialModuleProfileChatListDefault,
};
