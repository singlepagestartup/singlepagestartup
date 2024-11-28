import { Component as Find } from "./find";
import { Component as AdminTableRow } from "./admin-table-row";
import { Component as AdminTable } from "./admin-table";
import { Component as AdminSelectInput } from "./admin-select-input";
import { Component as AdminForm } from "./admin-form";
import { Component as Default } from "./default";
import { Component as Init } from "./init";
import { Component as LoginAndPassword } from "./login-and-password";
import { Component as LogoutAction } from "./logout-action";
import { Component as LogoutButton } from "./logout-button";
import { Component as IsAllowedWrapper } from "./is-authorized-wrapper";
import { Component as SelectMethod } from "./select-method";
import { Component as EthereumVirtualMachine } from "./ethereum-virtual-machine";
import { Component as Me } from "./me";
import { Component as GetEmails } from "./get-emails";
import { Component as EcommerceProductOneStepCheckout } from "./ecommerce-product-one-step-checkout";
import { Component as EcommerceProductCart } from "./ecommerce-product-cart";
import { Component as ProfileButtonDefault } from "./profile-button-default";
import { Component as OverviewDefault } from "./overview-default";
import { Component as IdentitiesUpdateDefault } from "./identities-update-default";
import { Component as IdentitiesCreateDefault } from "./identities-create-default";

export const variants = {
  find: Find,
  "admin-table-row": AdminTableRow,
  "admin-table": AdminTable,
  "admin-select-input": AdminSelectInput,
  "admin-form": AdminForm,
  default: Default,
  init: Init,
  "login-and-password": LoginAndPassword,
  "logout-action": LogoutAction,
  "logout-button": LogoutButton,
  "is-authorized-wrapper": IsAllowedWrapper,
  "select-method": SelectMethod,
  "ethereum-virtual-machine": EthereumVirtualMachine,
  me: Me,
  "get-emails": GetEmails,
  "ecommerce-product-one-step-checkout": EcommerceProductOneStepCheckout,
  "profile-button-default": ProfileButtonDefault,
  "overview-default": OverviewDefault,
  "identities-update-default": IdentitiesUpdateDefault,
  "identities-create-default": IdentitiesCreateDefault,
  "ecommerce-product-cart": EcommerceProductCart,
};
