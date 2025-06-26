"use client";

import {
  IModel,
  route,
  clientHost,
  query,
  options,
} from "@sps/rbac/models/subject/sdk/model";
import { factory, queryClient } from "@sps/shared-frontend-client-api";
export { Provider, queryClient } from "@sps/shared-frontend-client-api";

import {
  action as authenticationInit,
  type IProps as IAuthenticationInitProps,
  type IResult as IAuthenticationInitResult,
} from "./authentication/init";
import {
  action as authenticationMe,
  type IProps as IAuthenticationMeProps,
  type IResult as IAuthenticationMeResult,
} from "./authentication/me";
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
  action as authenticationRefresh,
  type IProps as IAuthenticationRefreshProps,
  type IResult as IAuthenticationRefreshResult,
} from "./authentication/refresh";
import {
  action as authenticationEmailAndPasswordForgotPassword,
  type IProps as IAuthenticationEmailAndPasswordForgotPasswordProps,
  type IResult as IAuthenticationEmailAndPasswordForgotPasswordResult,
} from "./authentication/email-and-password/forgot-password";
import {
  action as authenticationLogout,
  type IProps as IAuthenticationLogoutProps,
  type IResult as IAuthenticationLogoutResult,
} from "./authentication/logout";
import {
  action as authenticationIsAuthorized,
  type IProps as IAuthenticationIsAuthorizedProps,
  type IResult as IAuthenticationIsAuthorizedResult,
} from "./authentication/is-authorized";
import {
  action as authenticationEthereumVirtualMachine,
  type IProps as IAuthenticationEthereumVirtualMachineProps,
  type IResult as IAuthenticationEthereumVirtualMachineResult,
} from "./authentication/ethereum-virtual-machine";
import {
  action as authenticationEmailAndPasswordResetPassword,
  type IProps as IAuthenticationEmailAndPasswordResetPasswordProps,
  type IResult as IAuthenticationEmailAndPasswordResetPasswordResult,
} from "./authentication/email-and-password/reset-password";

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
  action as ecommerceModuleOrderTotal,
  type IProps as IEcommerceModuleOrderTotalProps,
  type IResult as IEcommerceModuleOrderTotalResult,
} from "./ecommerce-module/order/total";
import {
  action as ecommerceModuleOrderList,
  type IProps as IEcommerceModuleOrderListProps,
  type IResult as IEcommerceModuleOrderListResult,
} from "./ecommerce-module/order/list";
import {
  action as ecommerceModuleOrderQuantity,
  type IProps as IEcommerceModuleOrderQuantityProps,
  type IResult as IEcommerceModuleOrderQuantityResult,
} from "./ecommerce-module/order/quantity";
import {
  action as ecommerceModuleOrderUpdate,
  type IProps as IEcommerceModuleOrderUpdateProps,
  type IResult as IEcommerceModuleOrderUpdateResult,
} from "./ecommerce-module/order/id/update";
import {
  action as ecommerceModuleOrderCheckout,
  type IProps as IEcommerceModuleOrderCheckoutProps,
  type IResult as IEcommerceModuleOrderCheckoutResult,
} from "./ecommerce-module/order/checkout";
import {
  action as ecommerceModuleOrderDelete,
  type IProps as IEcommerceModuleOrderDeleteProps,
  type IResult as IEcommerceModuleOrderDeleteResult,
} from "./ecommerce-module/order/id/delete";

import {
  action as identityUpdate,
  type IProps as IIdentityUpdateProps,
  type IResult as IIdentityUpdateResult,
} from "./identity/update";
import {
  action as identityDelete,
  type IProps as IIdentityDeleteProps,
  type IResult as IIdentityDeleteResult,
} from "./identity/delete";
import {
  action as identityCreate,
  type IProps as IIdentityCreateProps,
  type IResult as IIdentityCreateResult,
} from "./identity/create";

import {
  action as crmModuleFromRequestCreate,
  type IProps as ICrmModuleFromRequestCreateProps,
  type IResult as ICrmModuleFromRequestCreateResult,
} from "./crm-module/from/request/create";

import {
  action as socialModuleProfileFindByIdChatFind,
  type IProps as ISocialModuleProfileFindByIdChatFindProps,
  type IResult as ISocialModuleProfileFindByIdChatFindResult,
} from "./social-module/profile/find-by-id/chat/find";

export type IProps = {
  IAuthenticationInitProps: IAuthenticationInitProps;
  IAuthenticationMeProps: IAuthenticationMeProps;
  IAuthenticationEthereumVirtualMachineProps: IAuthenticationEthereumVirtualMachineProps;
  IAuthenticationEmailAndPasswordAuthenticationProps: IAuthenticationEmailAndPasswordAuthenticationProps;
  IAuthenticationEmailAndPasswordRegistrationProps: IAuthenticationEmailAndPasswordRegistrationProps;
  IAuthenticationIsAuthorizedProps: IAuthenticationIsAuthorizedProps;
  IAuthenticationRefreshProps: IAuthenticationRefreshProps;
  IAuthenticationEmailAndPasswordForgotPasswordProps: IAuthenticationEmailAndPasswordForgotPasswordProps;
  IAuthenticationLogoutProps: IAuthenticationLogoutProps;
  IAuthenticationEmailAndPasswordResetPasswordProps: IAuthenticationEmailAndPasswordResetPasswordProps;

  IIdentityUpdateProps: IIdentityUpdateProps;
  IIdentityDeleteProps: IIdentityDeleteProps;
  IIdentityCreateProps: IIdentityCreateProps;

  IEcommerceModuleProductCheckoutProps: IEcommerceModuleProductCheckoutProps;
  IEcommerceModuleOrderCreateProps: IEcommerceModuleOrderCreateProps;
  IEcommerceModuleOrderUpdateProps: IEcommerceModuleOrderUpdateProps;
  IEcommerceModuleOrderCheckoutProps: IEcommerceModuleOrderCheckoutProps;
  IEcommerceModuleOrderDeleteProps: IEcommerceModuleOrderDeleteProps;
  IEcommerceModuleOrderTotalProps: IEcommerceModuleOrderTotalProps;
  IEcommerceModuleOrderQuantityProps: IEcommerceModuleOrderQuantityProps;
  IEcommerceModuleOrderListProps: IEcommerceModuleOrderListProps;

  ICrmModuleFromRequestCreateProps: ICrmModuleFromRequestCreateProps;

  ISocialModuleProfileFindByIdChatFindProps: ISocialModuleProfileFindByIdChatFindProps;
};

export type IResult = {
  IAuthenticationInitResult: IAuthenticationInitResult;
  IAuthenticationMeResult: IAuthenticationMeResult;
  IAuthenticationEthereumVirtualMachineResult: IAuthenticationEthereumVirtualMachineResult;
  IAuthenticationEmailAndPasswordAuthenticationResult: IAuthenticationEmailAndPasswordAuthenticationResult;
  IAuthenticationEmailAndPasswordRegistrationResult: IAuthenticationEmailAndPasswordRegistrationResult;
  IAuthenticationIsAuthorizedResult: IAuthenticationIsAuthorizedResult;
  IAuthenticationRefreshResult: IAuthenticationRefreshResult;
  IAuthenticationEmailAndPasswordForgotPasswordResult: IAuthenticationEmailAndPasswordForgotPasswordResult;
  IAuthenticationLogoutResult: IAuthenticationLogoutResult;
  IAuthenticationEmailAndPasswordResetPasswordResult: IAuthenticationEmailAndPasswordResetPasswordResult;

  IIdentityUpdateResult: IIdentityUpdateResult;
  IIdentityDeleteResult: IIdentityDeleteResult;
  IIdentityCreateResult: IIdentityCreateResult;

  IEcommerceModuleProductCheckoutResult: IEcommerceModuleProductCheckoutResult;
  IEcommerceModuleOrderCreateResult: IEcommerceModuleOrderCreateResult;
  IEcommerceModuleOrderUpdateResult: IEcommerceModuleOrderUpdateResult;
  IEcommerceModuleOrderCheckoutResult: IEcommerceModuleOrderCheckoutResult;
  IEcommerceModuleOrderDeleteResult: IEcommerceModuleOrderDeleteResult;
  IEcommerceModuleOrderTotalResult: IEcommerceModuleOrderTotalResult;
  IEcommerceModuleOrderQuantityResult: IEcommerceModuleOrderQuantityResult;
  IEcommerceModuleOrderListResult: IEcommerceModuleOrderListResult;

  ICrmModuleFromRequestCreateResult: ICrmModuleFromRequestCreateResult;

  ISocialModuleProfileFindByIdChatFindResult: ISocialModuleProfileFindByIdChatFindResult;
};

export const api = {
  ...factory<IModel>({
    queryClient,
    route,
    host: clientHost,
    params: query,
    options,
  }),
  authenticationInit,
  authenticationMe,
  authenticationEthereumVirtualMachine,
  authenticationEmailAndPasswordAuthentication,
  authenticationEmailAndPasswordRegistration,
  authenticationIsAuthorized,
  authenticationRefresh,
  authenticationEmailAndPasswordForgotPassword,
  authenticationLogout,
  authenticationEmailAndPasswordResetPassword,

  identityUpdate,
  identityDelete,
  identityCreate,

  ecommerceModuleProductCheckout,
  ecommerceModuleOrderCreate,
  ecommerceModuleOrderUpdate,
  ecommerceModuleOrderCheckout,
  ecommerceModuleOrderDelete,
  ecommerceModuleOrderTotal,
  ecommerceModuleOrderQuantity,
  ecommerceModuleOrderList,

  crmModuleFromRequestCreate,

  socialModuleProfileFindByIdChatFind,
};
