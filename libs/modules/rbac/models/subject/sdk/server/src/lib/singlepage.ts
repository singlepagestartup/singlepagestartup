import { factory } from "@sps/shared-frontend-server-api";
import {
  serverHost,
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
  action as authenticationEmailAndPasswordForgotPassword,
  type IProps as IAuthenticationEmailAndPasswordForgotPasswordProps,
  type IResult as IAuthenticationEmailAndPasswordForgotPasswordResult,
} from "./actions/authentication/email-and-password/forgot-password";
import {
  action as authenticationEmailAndPasswordResetPassword,
  type IProps as IAuthenticationEmailAndPasswordResetPasswordProps,
  type IResult as IAuthenticationEmailAndPasswordResetPasswordResult,
} from "./actions/authentication/email-and-password/reset-password";
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
  action as authenticationEmailAndPasswordAuthentication,
  type IProps as IAuthenticationEmailAndPasswordAuthenticationProps,
  type IResult as IAuthenticationEmailAndPasswordAuthenticationResult,
} from "./actions/authentication/email-and-password/authentication";
import {
  action as authenticationEmailAndPasswordRegistration,
  type IProps as IAuthenticationEmailAndPasswordRegistrationProps,
  type IResult as IAuthenticationEmailAndPasswordRegistrationResult,
} from "./actions/authentication/email-and-password/registration";
import {
  action as crmModuleFromRequestCreate,
  type IProps as ICrmModuleFromRequestCreateProps,
  type IResult as ICrmModuleFromRequestCreateResult,
} from "./actions/crm-module/form/request/create";

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
  IAuthenticationEmailAndPasswordAuthenticationProps: IAuthenticationEmailAndPasswordAuthenticationProps;
  IAuthenticationEmailAndPasswordRegistrationProps: IAuthenticationEmailAndPasswordRegistrationProps;
  IAuthenticationEmailAndPasswordForgotPasswordProps: IAuthenticationEmailAndPasswordForgotPasswordProps;
  IAuthenticationEmailAndPasswordResetPasswordProps: IAuthenticationEmailAndPasswordResetPasswordProps;
  IAuthenticationLogoutProps: IAuthenticationLogoutProps;
  IAuthenticationRefreshProps: IAuthenticationRefreshProps;
  IAuthenticationIsAuthorizedProps: IAuthenticationIsAuthorizedProps;
  ICrmModuleFromRequestCreateProps: ICrmModuleFromRequestCreateProps;
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
  IAuthenticationEmailAndPasswordAuthenticationResult: IAuthenticationEmailAndPasswordAuthenticationResult;
  IAuthenticationEmailAndPasswordRegistrationResult: IAuthenticationEmailAndPasswordRegistrationResult;
  IAuthenticationEmailAndPasswordForgotPasswordResult: IAuthenticationEmailAndPasswordForgotPasswordResult;
  IAuthenticationEmailAndPasswordResetPasswordResult: IAuthenticationEmailAndPasswordResetPasswordResult;
  IAuthenticationLogoutResult: IAuthenticationLogoutResult;
  IAuthenticationRefreshResult: IAuthenticationRefreshResult;
  IAuthenticationIsAuthorizedResult: IAuthenticationIsAuthorizedResult;
  ICrmModuleFromRequestCreateResult: ICrmModuleFromRequestCreateResult;
};

export const api = {
  ...factory<IModel>({
    route,
    host: serverHost,
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
  authenticationEmailAndPasswordAuthentication,
  authenticationEmailAndPasswordRegistration,
  authenticationEmailAndPasswordForgotPassword,
  authenticationEmailAndPasswordResetPassword,
  authenticationLogout,
  authenticationRefresh,
  authenticationIsAuthorized,
  crmModuleFromRequestCreate,
};
