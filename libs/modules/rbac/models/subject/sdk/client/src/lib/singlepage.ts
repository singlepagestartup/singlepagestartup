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
  action as authenticationInit,
  type IProps as IAuthenticationInitProps,
  type IResult as IAuthenticationInitResult,
} from "./actions/authentication/init";
import {
  action as authenticationMe,
  type IProps as IAuthenticationMeProps,
  type IResult as IAuthenticationMeResult,
} from "./actions/authentication/me";
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
  action as authenticationRefresh,
  type IProps as IAuthenticationRefreshProps,
  type IResult as IAuthenticationRefreshResult,
} from "./actions/authentication/refresh";
import {
  action as authenticationLoginAndPasswordForgotPassword,
  type IProps as IAuthenticationLoginAndPasswordForgotPasswordProps,
  type IResult as IAuthenticationLoginAndPasswordForgotPasswordResult,
} from "./actions/authentication/login-and-password/forgot-password";
import {
  action as authenticationLogout,
  type IProps as IAuthenticationLogoutProps,
  type IResult as IAuthenticationLogoutResult,
} from "./actions/authentication/logout";
import {
  action as authenticationIsAuthorized,
  type IProps as IAuthenticationIsAuthorizedProps,
  type IResult as IAuthenticationIsAuthorizedResult,
} from "./actions/authentication/is-authorized";
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
  action as authenticationLoginAndPasswordResetPassword,
  type IProps as IAuthenticationLoginAndPasswordResetPasswordProps,
  type IResult as IAuthenticationLoginAndPasswordResetPasswordResult,
} from "./actions/authentication/login-and-password/reset-password";
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
  IAuthenticationInitProps: IAuthenticationInitProps;
  IAuthenticationMeProps: IAuthenticationMeProps;
  IAuthenticationEthereumVirtualMachineProps: IAuthenticationEthereumVirtualMachineProps;
  IAuthenticationLoginAndPasswordAuthenticationProps: IAuthenticationLoginAndPasswordAuthenticationProps;
  IAuthenticationLoginAndPasswordRegistrationProps: IAuthenticationLoginAndPasswordRegistrationProps;
  IAuthenticationIsAuthorizedProps: IAuthenticationIsAuthorizedProps;
  IAuthenticationRefreshProps: IAuthenticationRefreshProps;
  IAuthenticationLoginAndPasswordForgotPasswordProps: IAuthenticationLoginAndPasswordForgotPasswordProps;
  IAuthenticationLogoutProps: IAuthenticationLogoutProps;
  IAuthenticationLoginAndPasswordResetPasswordProps: IAuthenticationLoginAndPasswordResetPasswordProps;
  IIdentityUpdateProps: IIdentityUpdateProps;
  IIdentityDeleteProps: IIdentityDeleteProps;
  IIdentityCreateProps: IIdentityCreateProps;
  IEcommerceProductCheckoutProps: IEcommerceProductCheckoutProps;
  IEcommerceOrderCreateProps: IEcommerceOrderCreateProps;
  IEcommerceOrderUpdateProps: IEcommerceOrderUpdateProps;
  IEcommerceOrderCheckoutProps: IEcommerceOrderCheckoutProps;
  IEcommerceOrderDeleteProps: IEcommerceOrderDeleteProps;
};

export type IResult = {
  IAuthenticationInitResult: IAuthenticationInitResult;
  IAuthenticationMeResult: IAuthenticationMeResult;
  IAuthenticationEthereumVirtualMachineResult: IAuthenticationEthereumVirtualMachineResult;
  IAuthenticationLoginAndPasswordAuthenticationResult: IAuthenticationLoginAndPasswordAuthenticationResult;
  IAuthenticationLoginAndPasswordRegistrationResult: IAuthenticationLoginAndPasswordRegistrationResult;
  IAuthenticationIsAuthorizedResult: IAuthenticationIsAuthorizedResult;
  IAuthenticationRefreshResult: IAuthenticationRefreshResult;
  IAuthenticationLoginAndPasswordForgotPasswordResult: IAuthenticationLoginAndPasswordForgotPasswordResult;
  IAuthenticationLogoutResult: IAuthenticationLogoutResult;
  IAuthenticationLoginAndPasswordResetPasswordResult: IAuthenticationLoginAndPasswordResetPasswordResult;
  IIdentityUpdateResult: IIdentityUpdateResult;
  IIdentityDeleteResult: IIdentityDeleteResult;
  IIdentityCreateResult: IIdentityCreateResult;
  IEcommerceProductCheckoutResult: IEcommerceProductCheckoutResult;
  IEcommerceOrderCreateResult: IEcommerceOrderCreateResult;
  IEcommerceOrderUpdateResult: IEcommerceOrderUpdateResult;
  IEcommerceOrderCheckoutResult: IEcommerceOrderCheckoutResult;
  IEcommerceOrderDeleteResult: IEcommerceOrderDeleteResult;
};

export const api = {
  ...factory<IModel>({
    queryClient,
    route,
    host,
    params: query,
    options,
  }),
  authenticationInit,
  authenticationMe,
  authenticationEthereumVirtualMachine,
  authenticationLoginAndPasswordAuthentication,
  authenticationLoginAndPasswordRegistration,
  authenticationIsAuthorized,
  authenticationRefresh,
  authenticationLoginAndPasswordForgotPassword,
  authenticationLogout,
  authenticationLoginAndPasswordResetPassword,
  identityUpdate,
  identityDelete,
  identityCreate,
  ecommerceProductCheckout,
  ecommerceOrderCreate,
  ecommerceOrderUpdate,
  ecommerceOrderCheckout,
  ecommerceOrderDelete,
};
