import { factory } from "@sps/shared-frontend-server-api";
import {
  serverHost,
  route,
  IModel,
  query,
  options,
} from "@sps/rbac/models/subject/sdk/model";

import {
  action as notify,
  type IProps as INotifyProps,
  type IResult as INotifyResult,
} from "./notify";

import {
  action as ecommerceModuleProductCheckout,
  type IProps as IEcommerceModuleProductCheckoutProps,
  type IResult as IEcommerceModuleProductCheckoutResult,
} from "./ecommerce-module/product/checkout";
import {
  action as ecommerceModuleOrderCreate,
  type IProps as IEcommerceModuleOrderCreateProps,
  type IResult as IEcommerceModuleOrderCreateResult,
} from "./ecommerce-module/order/create";
import {
  action as ecommerceModuleOrderUpdate,
  type IProps as IEcommerceModuleOrderUpdateProps,
  type IResult as IEcommerceModuleOrderUpdateResult,
} from "./ecommerce-module/order/id/update";
import {
  action as ecommerceModuleOrderDelete,
  type IProps as IEcommerceModuleOrderDeleteProps,
  type IResult as IEcommerceModuleOrderDeleteResult,
} from "./ecommerce-module/order/id/delete";
import {
  action as ecommerceModuleOrderIdCheckout,
  type IProps as IEcommerceModuleOrderIdCheckoutProps,
  type IResult as IEcommerceModuleOrderIdCheckoutResult,
} from "./ecommerce-module/order/id/checkout";
import {
  action as ecommerceModuleOrderTotal,
  type IProps as IEcommerceModuleOrderTotalProps,
  type IResult as IEcommerceModuleOrderTotalResult,
} from "./ecommerce-module/order/total";
import {
  action as ecommerceModuleOrderQuantity,
  type IProps as IEcommerceModuleOrderQuantityProps,
  type IResult as IEcommerceModuleOrderQuantityResult,
} from "./ecommerce-module/order/quantity";
import {
  action as ecommerceModuleOrderCheckout,
  type IProps as IEcommerceModuleOrderCheckoutProps,
  type IResult as IEcommerceModuleOrderCheckoutResult,
} from "./ecommerce-module/order/checkout";
import {
  action as ecommerceModuleOrderList,
  type IProps as IEcommerceModuleOrderListProps,
  type IResult as IEcommerceModuleOrderListResult,
} from "./ecommerce-module/order/list";

import {
  action as identityFind,
  type IProps as IIdentityFindProps,
  type IResult as IIdentityFindResult,
} from "./identity/find";
import {
  action as identityUpdate,
  type IProps as IIdentityUpdateProps,
  type IResult as IIdentityUpdateResult,
} from "./identity/update";
import {
  action as identityCreate,
  type IProps as IIdentityCreateProps,
  type IResult as IIdentityCreateResult,
} from "./identity/create";
import {
  action as identityDelete,
  type IProps as IIdentityDeleteProps,
  type IResult as IIdentityDeleteResult,
} from "./identity/delete";

import {
  action as authenticationMe,
  type IProps as IAuthenticationMeProps,
  type IResult as IAuthenticationMeResult,
} from "./authentication/me";
import {
  action as authenticationLogout,
  type IProps as IAuthenticationLogoutProps,
  type IResult as IAuthenticationLogoutResult,
} from "./authentication/logout";
import {
  action as authenticationRefresh,
  type IProps as IAuthenticationRefreshProps,
  type IResult as IAuthenticationRefreshResult,
} from "./authentication/refresh";
import {
  action as authenticationIsAuthorized,
  type IProps as IAuthenticationIsAuthorizedProps,
  type IResult as IAuthenticationIsAuthorizedResult,
} from "./authentication/is-authorized";
import {
  action as authenticationEmailAndPasswordForgotPassword,
  type IProps as IAuthenticationEmailAndPasswordForgotPasswordProps,
  type IResult as IAuthenticationEmailAndPasswordForgotPasswordResult,
} from "./authentication/email-and-password/forgot-password";
import {
  action as authenticationEmailAndPasswordResetPassword,
  type IProps as IAuthenticationEmailAndPasswordResetPasswordProps,
  type IResult as IAuthenticationEmailAndPasswordResetPasswordResult,
} from "./authentication/email-and-password/reset-password";
import {
  action as authenticationInit,
  type IProps as IAuthenticationInitProps,
  type IResult as IAuthenticationInitResult,
} from "./authentication/init";
import {
  action as authenticationEthereumVirtualMachine,
  type IProps as IAuthenticationEthereumVirtualMachineProps,
  type IResult as IAuthenticationEthereumVirtualMachineResult,
} from "./authentication/ethereum-virtual-machine";
import {
  action as authenticationEmailAndPasswordAuthentication,
  type IProps as IAuthenticationEmailAndPasswordAuthenticationProps,
  type IResult as IAuthenticationEmailAndPasswordAuthenticationResult,
} from "./authentication/email-and-password/authentication";
import {
  action as authenticationEmailAndPasswordRegistration,
  type IProps as IAuthenticationEmailAndPasswordRegistrationProps,
  type IResult as IAuthenticationEmailAndPasswordRegistrationResult,
} from "./authentication/email-and-password/registration";

import {
  action as crmModuleFromRequestCreate,
  type IProps as ICrmModuleFromRequestCreateProps,
  type IResult as ICrmModuleFromRequestCreateResult,
} from "./crm-module/form/request/create";

import {
  action as socialModuleProfileFindByIdChatFind,
  type IProps as ISocialModuleProfileFindByIdChatFindProps,
  type IResult as ISocialModuleProfileFindByIdChatFindResult,
} from "./social-module/profile/find-by-id/chat/find";

export type IProps = {
  INotifyProps: INotifyProps;

  IEcommerceModuleProductCheckoutProps: IEcommerceModuleProductCheckoutProps;
  IEcommerceModuleOrderCreateProps: IEcommerceModuleOrderCreateProps;
  IEcommerceModuleOrderUpdateProps: IEcommerceModuleOrderUpdateProps;
  IEcommerceModuleOrderDeleteProps: IEcommerceModuleOrderDeleteProps;
  IEcommerceModuleOrderCheckoutProps: IEcommerceModuleOrderCheckoutProps;
  IEcommerceModuleOrderTotalProps: IEcommerceModuleOrderTotalProps;
  IEcommerceModuleOrderQuantityProps: IEcommerceModuleOrderQuantityProps;
  IEcommerceModuleOrderIdCheckoutProps: IEcommerceModuleOrderIdCheckoutProps;
  IEcommerceModuleOrderListProps: IEcommerceModuleOrderListProps;

  IIdentityFindProps: IIdentityFindProps;
  IIdentityUpdateProps: IIdentityUpdateProps;
  IIdentityCreateProps: IIdentityCreateProps;
  IIdentityDeleteProps: IIdentityDeleteProps;

  IAuthenticationMeProps: IAuthenticationMeProps;
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

  ISocialModuleProfileFindByIdChatFindProps: ISocialModuleProfileFindByIdChatFindProps;
};

export type IResult = {
  INotifyResult: INotifyResult;

  IEcommerceModuleProductCheckoutResult: IEcommerceModuleProductCheckoutResult;
  IEcommerceModuleOrderCreateResult: IEcommerceModuleOrderCreateResult;
  IEcommerceModuleOrderUpdateResult: IEcommerceModuleOrderUpdateResult;
  IEcommerceModuleOrderDeleteResult: IEcommerceModuleOrderDeleteResult;
  IEcommerceModuleOrderCheckoutResult: IEcommerceModuleOrderCheckoutResult;
  IEcommerceModuleOrderTotalResult: IEcommerceModuleOrderTotalResult;
  IEcommerceModuleOrderQuantityResult: IEcommerceModuleOrderQuantityResult;
  IEcommerceModuleOrderIdCheckoutResult: IEcommerceModuleOrderIdCheckoutResult;
  IEcommerceModuleOrderListResult: IEcommerceModuleOrderListResult;

  IIdentityFindResult: IIdentityFindResult;
  IIdentityUpdateResult: IIdentityUpdateResult;
  IIdentityCreateResult: IIdentityCreateResult;
  IIdentityDeleteResult: IIdentityDeleteResult;

  IAuthenticationMeResult: IAuthenticationMeResult;
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

  ISocialModuleProfileFindByIdChatFindResult: ISocialModuleProfileFindByIdChatFindResult;
};

export const api = {
  ...factory<IModel>({
    route,
    host: serverHost,
    options,
    params: query,
  }),

  notify,

  ecommerceModuleProductCheckout,
  ecommerceModuleOrderCreate,
  ecommerceModuleOrderUpdate,
  ecommerceModuleOrderDelete,
  ecommerceModuleOrderCheckout,
  ecommerceModuleOrderTotal,
  ecommerceModuleOrderQuantity,
  ecommerceModuleOrderIdCheckout,
  ecommerceModuleOrderList,

  identityFind,
  identityUpdate,
  identityCreate,
  identityDelete,

  authenticationMe,
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

  socialModuleProfileFindByIdChatFind,
};
