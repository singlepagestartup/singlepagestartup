import { Component as Find } from "./find";
import { Component as AdminTableRow } from "./admin/table-row";
import { Component as AdminTable } from "./admin/table";
import { Component as AdminSelectInput } from "./admin/select-input";
import { Component as AdminForm } from "./admin/form";
import { Component as Default } from "./default";
import { Component as AuthenticationInitDefault } from "./authentication/init-default";
import { Component as AuthenticationLoginAndPasswordAuthenticationFormDefault } from "./authentication/login-and-password/authentication-form-default";
import { Component as AuthenticationLogoutActionDefault } from "./authentication/logout-action-default";
import { Component as AuthenticationLogoutButtonDefault } from "./authentication/logout-button-default";
import { Component as AuthenticationIsAllowedWrapperDefault } from "./authentication/is-authorized-wrapper-default";
import { Component as AuthenticationSelectMethodDefault } from "./authentication/select-method-default";
import { Component as AuthenticationEthereumVirtualMachineDefault } from "./authentication/ethereum-virtual-machine-default";
import { Component as AuthenticationMeDefault } from "./authentication/me-default";
import { Component as GetEmails } from "./identities/get-emails";
import { Component as EcommerceProductCheckout } from "./ecommerce/product-checkout";
import { Component as EcommerceProductCart } from "./ecommerce/product-cart";
import { Component as ProfileButtonDefault } from "./profile-button-default";
import { Component as OverviewDefault } from "./overview-default";
import { Component as IdentitiesUpdateDefault } from "./identities/update-default";
import { Component as IdentitiesCreateDefault } from "./identities/create-default";
import { Component as AuthenticationLoginAndPasswordForgotPasswordFormDefault } from "./authentication/login-and-password/forgot-password-form-default";
import { Component as AuthenticationLoginAndPasswordResetPasswordFormDefault } from "./authentication/login-and-password/reset-password-form-default";

export const variants = {
  find: Find,
  "admin-table-row": AdminTableRow,
  "admin-table": AdminTable,
  "admin-select-input": AdminSelectInput,
  "admin-form": AdminForm,
  default: Default,
  "authentication-init-default": AuthenticationInitDefault,
  "authentication-login-and-password-authentication-form-default":
    AuthenticationLoginAndPasswordAuthenticationFormDefault,
  "authentication-logout-action-default": AuthenticationLogoutActionDefault,
  "authentication-logout-button-default": AuthenticationLogoutButtonDefault,
  "authentication-is-authorized-wrapper-default":
    AuthenticationIsAllowedWrapperDefault,
  "authentication-select-method-default": AuthenticationSelectMethodDefault,
  "authentication-ethereum-virtual-machine-default":
    AuthenticationEthereumVirtualMachineDefault,
  "authentication-me-default": AuthenticationMeDefault,
  "authentication-login-and-password-forgot-password-form-default":
    AuthenticationLoginAndPasswordForgotPasswordFormDefault,
  "authentication-login-and-password-reset-password-form-default":
    AuthenticationLoginAndPasswordResetPasswordFormDefault,
  "identities-update-default": IdentitiesUpdateDefault,
  "identities-create-default": IdentitiesCreateDefault,
  "ecommerce-product-checkout": EcommerceProductCheckout,
  "ecommerce-product-cart": EcommerceProductCart,
  "get-emails": GetEmails,
  "profile-button-default": ProfileButtonDefault,
  "overview-default": OverviewDefault,
};
