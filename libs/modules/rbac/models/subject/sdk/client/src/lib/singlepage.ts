"use client";

import {
  IModel,
  route,
  host,
  query,
  options,
} from "@sps/rbac/models/subject/sdk/model";
import { factory, queryClient } from "@sps/shared-frontend-client-api";
export { Provider, queryClient } from "@sps/shared-frontend-client-api";
import {
  action as init,
  type IProps as IInitProps,
  type IResult as IInitResult,
} from "./actions/init";
import {
  action as me,
  type IProps as IMeProps,
  type IResult as IMeResult,
} from "./actions/me";
import {
  action as authenticationLoginAndPasswordAuthentication,
  type IProps as IAuthenticationLoginAndPasswordAuthenticationProps,
  type IResult as IAuthenticationLoginAndPasswordAuthenticationResult,
} from "./actions/authentication/login-and-password/authentication";
import {
  action as authenticationLoginAndPasswordRegistration,
  type IProps as IAuthenticationLoginAndPasswordRegistrationProps,
  type IResult as IAuthenticationLoginAndPasswordRegistrationResult,
} from "./actions/authentication/login-and-password/registration";
import {
  action as refresh,
  type IProps as IRefreshProps,
  type IResult as IRefreshResult,
} from "./actions/refresh";
import {
  action as forgotPassword,
  type IProps as IForgotPasswordProps,
  type IResult as IForgotPasswordResult,
} from "./actions/forgot-password";
import {
  action as logout,
  type IProps as ILogoutProps,
  type IResult as ILogoutResult,
} from "./actions/logout";
import {
  action as isAuthorized,
  type IProps as IIsAuthorizedProps,
  type IResult as IIsAuthorizedResult,
} from "./actions/is-authorized";
import {
  action as authenticationEthereumVirtualMachine,
  type IProps as IAuthenticationEthereumVirtualMachineProps,
  type IResult as IAuthenticationEthereumVirtualMachineResult,
} from "./actions/authentication/ethereum-virtual-machine";
import {
  action as ecommerceProductCheckout,
  type IProps as IEcommerceProductCheckoutProps,
  type IResult as IEcommerceProductCheckoutResult,
} from "./actions/ecommerce/product/checkout";
import {
  action as ecommerceOrderCreate,
  type IProps as IEcommerceOrderCreateProps,
  type IResult as IEcommerceOrderCreateResult,
} from "./actions/ecommerce/order/create";
import {
  action as resetPassword,
  type IProps as IResetPasswordProps,
  type IResult as IResetPasswordResult,
} from "./actions/reset-password";
import {
  action as ecommerceOrderUpdate,
  type IProps as IEcommerceOrderUpdateProps,
  type IResult as IEcommerceOrderUpdateResult,
} from "./actions/ecommerce/order/update";
import {
  action as ecommerceOrderCheckout,
  type IProps as IEcommerceOrderCheckoutProps,
  type IResult as IEcommerceOrderCheckoutResult,
} from "./actions/ecommerce/order/checkout";
import {
  action as ecommerceOrderDelete,
  type IProps as IEcommerceOrderDeleteProps,
  type IResult as IEcommerceOrderDeleteResult,
} from "./actions/ecommerce/order/delete";
import {
  action as identityUpdate,
  type IProps as IIdentityUpdateProps,
  type IResult as IIdentityUpdateResult,
} from "./actions/identity/update";
import {
  action as identityDelete,
  type IProps as IIdentityDeleteProps,
  type IResult as IIdentityDeleteResult,
} from "./actions/identity/delete";
import {
  action as identityCreate,
  type IProps as IIdentityCreateProps,
  type IResult as IIdentityCreateResult,
} from "./actions/identity/create";

export type IProps = {
  IInitProps: IInitProps;
  IMeProps: IMeProps;
  IRefreshProps: IRefreshProps;
  ILogoutProps: ILogoutProps;
  IIsAuthorizedProps: IIsAuthorizedProps;
  IAuthenticationEthereumVirtualMachineProps: IAuthenticationEthereumVirtualMachineProps;
  IEcommerceProductCheckoutProps: IEcommerceProductCheckoutProps;
  IEcommerceOrderCreateProps: IEcommerceOrderCreateProps;
  IForgotPasswordProps: IForgotPasswordProps;
  IResetPasswordProps: IResetPasswordProps;
  IEcommerceOrderUpdateProps: IEcommerceOrderUpdateProps;
  IEcommerceOrderCheckoutProps: IEcommerceOrderCheckoutProps;
  IEcommerceOrderDeleteProps: IEcommerceOrderDeleteProps;
  IIdentityUpdateProps: IIdentityUpdateProps;
  IIdentityDeleteProps: IIdentityDeleteProps;
  IIdentityCreateProps: IIdentityCreateProps;
  IAuthenticationLoginAndPasswordAuthenticationProps: IAuthenticationLoginAndPasswordAuthenticationProps;
  IAuthenticationLoginAndPasswordRegistrationProps: IAuthenticationLoginAndPasswordRegistrationProps;
};

export type IResult = {
  IInitResult: IInitResult;
  IMeResult: IMeResult;
  IRefreshResult: IRefreshResult;
  ILogoutResult: ILogoutResult;
  IIsAuthorizedResult: IIsAuthorizedResult;
  IAuthenticationEthereumVirtualMachineResult: IAuthenticationEthereumVirtualMachineResult;
  IEcommerceProductCheckoutResult: IEcommerceProductCheckoutResult;
  IEcommerceOrderCreateResult: IEcommerceOrderCreateResult;
  IForgotPasswordResult: IForgotPasswordResult;
  IResetPasswordResult: IResetPasswordResult;
  IEcommerceOrderUpdateResult: IEcommerceOrderUpdateResult;
  IEcommerceOrderCheckoutResult: IEcommerceOrderCheckoutResult;
  IEcommerceOrderDeleteResult: IEcommerceOrderDeleteResult;
  IIdentityUpdateResult: IIdentityUpdateResult;
  IIdentityDeleteResult: IIdentityDeleteResult;
  IIdentityCreateResult: IIdentityCreateResult;
  IAuthenticationLoginAndPasswordAuthenticationResult: IAuthenticationLoginAndPasswordAuthenticationResult;
  IAuthenticationLoginAndPasswordRegistrationResult: IAuthenticationLoginAndPasswordRegistrationResult;
};

export const api = {
  ...factory<IModel>({
    queryClient,
    route,
    host,
    params: query,
    options,
  }),
  init,
  me,
  refresh,
  logout,
  isAuthorized,
  authenticationEthereumVirtualMachine,
  ecommerceProductCheckout,
  ecommerceOrderCreate,
  forgotPassword,
  resetPassword,
  ecommerceOrderUpdate,
  ecommerceOrderCheckout,
  ecommerceOrderDelete,
  identityUpdate,
  identityDelete,
  identityCreate,
  authenticationLoginAndPasswordAuthentication,
  authenticationLoginAndPasswordRegistration,
};
