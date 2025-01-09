import { factory } from "@sps/shared-frontend-server-api";
import {
  host,
  route,
  IModel,
  query,
  options,
} from "@sps/rbac/models/subject/sdk/model";
import {
  action as authenticationMe,
  type IProps as IAuthenticationMeProps,
  type IResult as IAuthenticationMeResult,
} from "./actions/authentication/me";
import {
  action as authenticationLogout,
  type IProps as IAuthenticationLogoutProps,
  type IResult as IAuthenticationLogoutResult,
} from "./actions/authentication/logout";
import {
  action as authenticationRefresh,
  type IProps as IAuthenticationRefreshProps,
  type IResult as IAuthenticationRefreshResult,
} from "./actions/authentication/refresh";
import {
  action as authenticationIsAuthorized,
  type IProps as IAuthenticationIsAuthorizedProps,
  type IResult as IAuthenticationIsAuthorizedResult,
} from "./actions/authentication/is-authorized";
import {
  action as identityFind,
  type IProps as IIdentityFindProps,
  type IResult as IIdentityFindResult,
} from "./actions/identity/find";
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
  action as ecommerceOrderUpdate,
  type IProps as IEcommerceOrderUpdateProps,
  type IResult as IEcommerceOrderUpdateResult,
} from "./actions/ecommerce/order/update";
import {
  action as ecommerceOrderDelete,
  type IProps as IEcommerceOrderDeleteProps,
  type IResult as IEcommerceOrderDeleteResult,
} from "./actions/ecommerce/order/delete";
import {
  action as ecommerceOrderCheckout,
  type IProps as IEcommerceOrderCheckoutProps,
  type IResult as IEcommerceOrderCheckoutResult,
} from "./actions/ecommerce/order/checkout";
import {
  action as identityUpdate,
  type IProps as IIdentityUpdateProps,
  type IResult as IIdentityUpdateResult,
} from "./actions/identity/update";
import {
  action as identityCreate,
  type IProps as IIdentityCreateProps,
  type IResult as IIdentityCreateResult,
} from "./actions/identity/create";
import {
  action as identityDelete,
  type IProps as IIdentityDeleteProps,
  type IResult as IIdentityDeleteResult,
} from "./actions/identity/delete";
import {
  action as authenticationLoginAndPasswordForgotPassword,
  type IProps as IAuthenticationLoginAndPasswordForgotPasswordProps,
  type IResult as IAuthenticationLoginAndPasswordForgotPasswordResult,
} from "./actions/authentication/login-and-password/forgot-password";
import {
  action as authenticationLoginAndPasswordResetPassword,
  type IProps as IAuthenticationLoginAndPasswordResetPasswordProps,
  type IResult as IAuthenticationLoginAndPasswordResetPasswordResult,
} from "./actions/authentication/login-and-password/reset-password";
import {
  action as notify,
  type IProps as INotifyProps,
  type IResult as INotifyResult,
} from "./actions/notify";
import {
  action as authenticationInit,
  type IProps as IAuthenticationInitProps,
  type IResult as IAuthenticationInitResult,
} from "./actions/authentication/init";
import {
  action as authenticationEthereumVirtualMachine,
  type IProps as IAuthenticationEthereumVirtualMachineProps,
  type IResult as IAuthenticationEthereumVirtualMachineResult,
} from "./actions/authentication/ethereum-virtual-machine";
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

export type IProps = {
  IAuthenticationMeProps: IAuthenticationMeProps;
  INotifyProps: INotifyProps;
  IIdentityFindProps: IIdentityFindProps;
  IEcommerceProductCheckoutProps: IEcommerceProductCheckoutProps;
  IEcommerceOrderCreateProps: IEcommerceOrderCreateProps;
  IEcommerceOrderUpdateProps: IEcommerceOrderUpdateProps;
  IEcommerceOrderDeleteProps: IEcommerceOrderDeleteProps;
  IEcommerceOrderCheckoutProps: IEcommerceOrderCheckoutProps;
  IIdentityUpdateProps: IIdentityUpdateProps;
  IIdentityCreateProps: IIdentityCreateProps;
  IIdentityDeleteProps: IIdentityDeleteProps;
  IAuthenticationInitProps: IAuthenticationInitProps;
  IAuthenticationEthereumVirtualMachineProps: IAuthenticationEthereumVirtualMachineProps;
  IAuthenticationLoginAndPasswordAuthenticationProps: IAuthenticationLoginAndPasswordAuthenticationProps;
  IAuthenticationLoginAndPasswordRegistrationProps: IAuthenticationLoginAndPasswordRegistrationProps;
  IAuthenticationLoginAndPasswordForgotPasswordProps: IAuthenticationLoginAndPasswordForgotPasswordProps;
  IAuthenticationLoginAndPasswordResetPasswordProps: IAuthenticationLoginAndPasswordResetPasswordProps;
  IAuthenticationLogoutProps: IAuthenticationLogoutProps;
  IAuthenticationRefreshProps: IAuthenticationRefreshProps;
  IAuthenticationIsAuthorizedProps: IAuthenticationIsAuthorizedProps;
};

export type IResult = {
  IAuthenticationMeResult: IAuthenticationMeResult;
  INotifyResult: INotifyResult;
  IIdentityFindResult: IIdentityFindResult;
  IEcommerceProductCheckoutResult: IEcommerceProductCheckoutResult;
  IEcommerceOrderCreateResult: IEcommerceOrderCreateResult;
  IEcommerceOrderUpdateResult: IEcommerceOrderUpdateResult;
  IEcommerceOrderDeleteResult: IEcommerceOrderDeleteResult;
  IEcommerceOrderCheckoutResult: IEcommerceOrderCheckoutResult;
  IIdentityUpdateResult: IIdentityUpdateResult;
  IIdentityCreateResult: IIdentityCreateResult;
  IIdentityDeleteResult: IIdentityDeleteResult;
  IAuthenticationInitResult: IAuthenticationInitResult;
  IAuthenticationEthereumVirtualMachineResult: IAuthenticationEthereumVirtualMachineResult;
  IAuthenticationLoginAndPasswordAuthenticationResult: IAuthenticationLoginAndPasswordAuthenticationResult;
  IAuthenticationLoginAndPasswordRegistrationResult: IAuthenticationLoginAndPasswordRegistrationResult;
  IAuthenticationLoginAndPasswordForgotPasswordResult: IAuthenticationLoginAndPasswordForgotPasswordResult;
  IAuthenticationLoginAndPasswordResetPasswordResult: IAuthenticationLoginAndPasswordResetPasswordResult;
  IAuthenticationLogoutResult: IAuthenticationLogoutResult;
  IAuthenticationRefreshResult: IAuthenticationRefreshResult;
  IAuthenticationIsAuthorizedResult: IAuthenticationIsAuthorizedResult;
};

export const api = {
  ...factory<IModel>({
    route,
    host,
    options,
    params: query,
  }),
  authenticationMe,
  identityFind,
  ecommerceProductCheckout,
  ecommerceOrderCreate,
  ecommerceOrderUpdate,
  ecommerceOrderDelete,
  ecommerceOrderCheckout,
  identityUpdate,
  identityCreate,
  identityDelete,
  notify,
  authenticationInit,
  authenticationEthereumVirtualMachine,
  authenticationLoginAndPasswordAuthentication,
  authenticationLoginAndPasswordRegistration,
  authenticationLoginAndPasswordForgotPassword,
  authenticationLoginAndPasswordResetPassword,
  authenticationLogout,
  authenticationRefresh,
  authenticationIsAuthorized,
};
