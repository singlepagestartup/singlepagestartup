import { factory } from "@sps/shared-frontend-server-api";
import {
  host,
  route,
  IModel,
  query,
  options,
} from "@sps/rbac/models/subject/sdk/model";
import {
  action as me,
  type IProps as IMeProps,
  type IResult as IMeResult,
} from "./actions/me";
import {
  action as isAuthorized,
  type IProps as IIsAuthorizedProps,
  type IResult as IIsAuthorizedResult,
} from "./actions/is-authorized";
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
  action as init,
  type IProps as IInitProps,
  type IResult as IInitResult,
} from "./actions/init";
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
  IMeProps: IMeProps;
  IIsAuthorizedProps: IIsAuthorizedProps;
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
  IInitProps: IInitProps;
  IAuthenticationEthereumVirtualMachineProps: IAuthenticationEthereumVirtualMachineProps;
  IAuthenticationLoginAndPasswordAuthenticationProps: IAuthenticationLoginAndPasswordAuthenticationProps;
  IAuthenticationLoginAndPasswordRegistrationProps: IAuthenticationLoginAndPasswordRegistrationProps;
  IAuthenticationLoginAndPasswordForgotPasswordProps: IAuthenticationLoginAndPasswordForgotPasswordProps;
  IAuthenticationLoginAndPasswordResetPasswordProps: IAuthenticationLoginAndPasswordResetPasswordProps;
};

export type IResult = {
  IMeResult: IMeResult;
  IIsAuthorizedResult: IIsAuthorizedResult;
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
  IInitResult: IInitResult;
  IAuthenticationEthereumVirtualMachineResult: IAuthenticationEthereumVirtualMachineResult;
  IAuthenticationLoginAndPasswordAuthenticationResult: IAuthenticationLoginAndPasswordAuthenticationResult;
  IAuthenticationLoginAndPasswordRegistrationResult: IAuthenticationLoginAndPasswordRegistrationResult;
  IAuthenticationLoginAndPasswordForgotPasswordResult: IAuthenticationLoginAndPasswordForgotPasswordResult;
  IAuthenticationLoginAndPasswordResetPasswordResult: IAuthenticationLoginAndPasswordResetPasswordResult;
};

export const api = {
  ...factory<IModel>({
    route,
    host,
    options,
    params: query,
  }),
  me,
  isAuthorized,
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
  init,
  authenticationEthereumVirtualMachine,
  authenticationLoginAndPasswordAuthentication,
  authenticationLoginAndPasswordRegistration,
  authenticationLoginAndPasswordForgotPassword,
  authenticationLoginAndPasswordResetPassword,
};
