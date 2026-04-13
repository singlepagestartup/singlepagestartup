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
  action as check,
  type IProps as ICheckProps,
  type IResult as ICheckResult,
} from "./check";
import {
  action as telegramBootstrap,
  type IProps as ITelegramBootstrapProps,
  type IResult as ITelegramBootstrapResult,
} from "./telegram/bootstrap";
import {
  action as telegramSyncMembership,
  type IProps as ITelegramSyncMembershipProps,
  type IResult as ITelegramSyncMembershipResult,
} from "./telegram/sync-membership";
import {
  action as telegramCheckoutFreeSubscription,
  type IProps as ITelegramCheckoutFreeSubscriptionProps,
  type IResult as ITelegramCheckoutFreeSubscriptionResult,
} from "./telegram/checkout-free-subscription";

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
  action as authenticationBillRoute,
  type IProps as IAuthenticationBillRouteProps,
  type IResult as IAuthenticationBillRouteResult,
} from "./authentication/bill-route";
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
  action as authenticationOAuthStart,
  type IProps as IAuthenticationOAuthStartProps,
  type IResult as IAuthenticationOAuthStartResult,
} from "./authentication/oauth/start";
import {
  action as authenticationOAuthCallback,
  type IProps as IAuthenticationOAuthCallbackProps,
  type IResult as IAuthenticationOAuthCallbackResult,
} from "./authentication/oauth/callback";
import {
  action as authenticationOAuthExchange,
  type IProps as IAuthenticationOAuthExchangeProps,
  type IResult as IAuthenticationOAuthExchangeResult,
} from "./authentication/oauth/exchange";

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
import {
  action as socialModuleProfileFindByIdChatCreate,
  type IProps as ISocialModuleProfileFindByIdChatCreateProps,
  type IResult as ISocialModuleProfileFindByIdChatCreateResult,
} from "./social-module/profile/find-by-id/chat/create";
import {
  action as socialModuleProfileFindByIdChatFindById,
  type IProps as ISocialModuleProfileFindByIdChatFindByIdProps,
  type IResult as ISocialModuleProfileFindByIdChatFindByIdResult,
} from "./social-module/profile/find-by-id/chat/find-by-id/find-by-id";
import {
  action as socialModuleProfileFindByIdChatFindByIdMessageFind,
  type IProps as ISocialModuleProfileFindByIdChatFindByIdMessageFindProps,
  type IResult as ISocialModuleProfileFindByIdChatFindByIdMessageFindResult,
} from "./social-module/profile/find-by-id/chat/find-by-id/message/find";
import {
  action as socialModuleProfileFindByIdChatFindByIdMessageCreate,
  type IProps as ISocialModuleProfileFindByIdChatFindByIdMessageCreateProps,
  type IResult as ISocialModuleProfileFindByIdChatFindByIdMessageCreateResult,
} from "./social-module/profile/find-by-id/chat/find-by-id/message/create";
import {
  action as socialModuleProfileFindByIdChatFindByIdThreadFindByIdMessageFind,
  type IProps as ISocialModuleProfileFindByIdChatFindByIdThreadFindByIdMessageFindProps,
  type IResult as ISocialModuleProfileFindByIdChatFindByIdThreadFindByIdMessageFindResult,
} from "./social-module/profile/find-by-id/chat/find-by-id/thread/find-by-id/message/find";
import {
  action as socialModuleProfileFindByIdChatFindByIdThreadFindByIdMessageCreate,
  type IProps as ISocialModuleProfileFindByIdChatFindByIdThreadFindByIdMessageCreateProps,
  type IResult as ISocialModuleProfileFindByIdChatFindByIdThreadFindByIdMessageCreateResult,
} from "./social-module/profile/find-by-id/chat/find-by-id/thread/find-by-id/message/create";
import {
  action as socialModuleProfileFindByIdChatFindByIdMessageDelete,
  type IProps as ISocialModuleProfileFindByIdChatFindByIdMessageDeleteProps,
  type IResult as ISocialModuleProfileFindByIdChatFindByIdMessageDeleteResult,
} from "./social-module/profile/find-by-id/chat/find-by-id/message/delete";
import {
  action as socialModuleProfileFindByIdChatFindByIdMessageUpdate,
  type IProps as ISocialModuleProfileFindByIdChatFindByIdMessageUpdateProps,
  type IResult as ISocialModuleProfileFindByIdChatFindByIdMessageUpdateResult,
} from "./social-module/profile/find-by-id/chat/find-by-id/message/update";
import {
  action as socialModuleProfileFindByIdChatFindByIdMessageFindByIdReactByOpenrouter,
  type IProps as ISocialModuleProfileFindByIdChatFindByIdMessageFindByIdReactByOpenrouterProps,
  type IResult as ISocialModuleProfileFindByIdChatFindByIdMessageFindByIdReactByOpenrouterResult,
} from "./social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter";
import {
  action as socialModuleProfileFindByIdChatFindByIdDelete,
  type IProps as ISocialModuleProfileFindByIdChatFindByIdDeleteProps,
  type IResult as ISocialModuleProfileFindByIdChatFindByIdDeleteResult,
} from "./social-module/profile/find-by-id/chat/find-by-id/delete";
import {
  action as socialModuleProfileFindByIdChatFindByIdActionCreate,
  type IProps as ISocialModuleProfileFindByIdChatFindByIdActionCreateProps,
  type IResult as ISocialModuleProfileFindByIdChatFindByIdActionCreateResult,
} from "./social-module/profile/find-by-id/chat/find-by-id/action/create";
import {
  action as socialModuleProfileFindByIdChatFindByIdActionFind,
  type IProps as ISocialModuleProfileFindByIdChatFindByIdActionFindProps,
  type IResult as ISocialModuleProfileFindByIdChatFindByIdActionFindResult,
} from "./social-module/profile/find-by-id/chat/find-by-id/action/find";
import {
  action as socialModuleChatCreate,
  type IProps as ISocialModuleChatCreateProps,
  type IResult as ISocialModuleChatCreateResult,
} from "./social-module/chat/create";
import {
  action as socialModuleChatFindByIdThreadFind,
  type IProps as ISocialModuleChatFindByIdThreadFindProps,
  type IResult as ISocialModuleChatFindByIdThreadFindResult,
} from "./social-module/chat/find-by-id/thread/find";
import {
  action as socialModuleChatFindByIdThreadCreate,
  type IProps as ISocialModuleChatFindByIdThreadCreateProps,
  type IResult as ISocialModuleChatFindByIdThreadCreateResult,
} from "./social-module/chat/find-by-id/thread/create";

export type IProps = {
  INotifyProps: INotifyProps;
  ICheckProps: ICheckProps;
  ITelegramBootstrapProps: ITelegramBootstrapProps;
  ITelegramSyncMembershipProps: ITelegramSyncMembershipProps;
  ITelegramCheckoutFreeSubscriptionProps: ITelegramCheckoutFreeSubscriptionProps;

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
  IAuthenticationBillRouteProps: IAuthenticationBillRouteProps;
  IAuthenticationOAuthStartProps: IAuthenticationOAuthStartProps;
  IAuthenticationOAuthCallbackProps: IAuthenticationOAuthCallbackProps;
  IAuthenticationOAuthExchangeProps: IAuthenticationOAuthExchangeProps;

  ICrmModuleFromRequestCreateProps: ICrmModuleFromRequestCreateProps;

  ISocialModuleProfileFindByIdChatFindProps: ISocialModuleProfileFindByIdChatFindProps;
  ISocialModuleProfileFindByIdChatCreateProps: ISocialModuleProfileFindByIdChatCreateProps;
  ISocialModuleProfileFindByIdChatFindByIdProps: ISocialModuleProfileFindByIdChatFindByIdProps;
  ISocialModuleProfileFindByIdChatFindByIdMessageFindProps: ISocialModuleProfileFindByIdChatFindByIdMessageFindProps;
  ISocialModuleProfileFindByIdChatFindByIdMessageCreateProps: ISocialModuleProfileFindByIdChatFindByIdMessageCreateProps;
  ISocialModuleProfileFindByIdChatFindByIdThreadFindByIdMessageFindProps: ISocialModuleProfileFindByIdChatFindByIdThreadFindByIdMessageFindProps;
  ISocialModuleProfileFindByIdChatFindByIdThreadFindByIdMessageCreateProps: ISocialModuleProfileFindByIdChatFindByIdThreadFindByIdMessageCreateProps;
  ISocialModuleProfileFindByIdChatFindByIdMessageDeleteProps: ISocialModuleProfileFindByIdChatFindByIdMessageDeleteProps;
  ISocialModuleProfileFindByIdChatFindByIdMessageUpdateProps: ISocialModuleProfileFindByIdChatFindByIdMessageUpdateProps;
  ISocialModuleProfileFindByIdChatFindByIdMessageFindByIdReactByOpenrouterProps: ISocialModuleProfileFindByIdChatFindByIdMessageFindByIdReactByOpenrouterProps;
  ISocialModuleProfileFindByIdChatFindByIdDeleteProps: ISocialModuleProfileFindByIdChatFindByIdDeleteProps;
  ISocialModuleProfileFindByIdChatFindByIdActionCreateProps: ISocialModuleProfileFindByIdChatFindByIdActionCreateProps;
  ISocialModuleProfileFindByIdChatFindByIdActionFindProps: ISocialModuleProfileFindByIdChatFindByIdActionFindProps;
  ISocialModuleChatCreateProps: ISocialModuleChatCreateProps;
  ISocialModuleChatFindByIdThreadFindProps: ISocialModuleChatFindByIdThreadFindProps;
  ISocialModuleChatFindByIdThreadCreateProps: ISocialModuleChatFindByIdThreadCreateProps;
};

export type IResult = {
  INotifyResult: INotifyResult;
  ICheckResult: ICheckResult;
  ITelegramBootstrapResult: ITelegramBootstrapResult;
  ITelegramSyncMembershipResult: ITelegramSyncMembershipResult;
  ITelegramCheckoutFreeSubscriptionResult: ITelegramCheckoutFreeSubscriptionResult;

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
  IAuthenticationBillRouteResult: IAuthenticationBillRouteResult;
  IAuthenticationOAuthStartResult: IAuthenticationOAuthStartResult;
  IAuthenticationOAuthCallbackResult: IAuthenticationOAuthCallbackResult;
  IAuthenticationOAuthExchangeResult: IAuthenticationOAuthExchangeResult;

  ICrmModuleFromRequestCreateResult: ICrmModuleFromRequestCreateResult;

  ISocialModuleProfileFindByIdChatFindResult: ISocialModuleProfileFindByIdChatFindResult;
  ISocialModuleProfileFindByIdChatCreateResult: ISocialModuleProfileFindByIdChatCreateResult;
  ISocialModuleProfileFindByIdChatFindByIdResult: ISocialModuleProfileFindByIdChatFindByIdResult;
  ISocialModuleProfileFindByIdChatFindByIdMessageFindResult: ISocialModuleProfileFindByIdChatFindByIdMessageFindResult;
  ISocialModuleProfileFindByIdChatFindByIdMessageCreateResult: ISocialModuleProfileFindByIdChatFindByIdMessageCreateResult;
  ISocialModuleProfileFindByIdChatFindByIdThreadFindByIdMessageFindResult: ISocialModuleProfileFindByIdChatFindByIdThreadFindByIdMessageFindResult;
  ISocialModuleProfileFindByIdChatFindByIdThreadFindByIdMessageCreateResult: ISocialModuleProfileFindByIdChatFindByIdThreadFindByIdMessageCreateResult;
  ISocialModuleProfileFindByIdChatFindByIdMessageDeleteResult: ISocialModuleProfileFindByIdChatFindByIdMessageDeleteResult;
  ISocialModuleProfileFindByIdChatFindByIdMessageUpdateResult: ISocialModuleProfileFindByIdChatFindByIdMessageUpdateResult;
  ISocialModuleProfileFindByIdChatFindByIdMessageFindByIdReactByOpenrouterResult: ISocialModuleProfileFindByIdChatFindByIdMessageFindByIdReactByOpenrouterResult;
  ISocialModuleProfileFindByIdChatFindByIdDeleteResult: ISocialModuleProfileFindByIdChatFindByIdDeleteResult;
  ISocialModuleProfileFindByIdChatFindByIdActionCreateResult: ISocialModuleProfileFindByIdChatFindByIdActionCreateResult;
  ISocialModuleProfileFindByIdChatFindByIdActionFindResult: ISocialModuleProfileFindByIdChatFindByIdActionFindResult;
  ISocialModuleChatCreateResult: ISocialModuleChatCreateResult;
  ISocialModuleChatFindByIdThreadFindResult: ISocialModuleChatFindByIdThreadFindResult;
  ISocialModuleChatFindByIdThreadCreateResult: ISocialModuleChatFindByIdThreadCreateResult;
};

export const api = {
  ...factory<IModel>({
    route,
    host: serverHost,
    options,
    params: query,
  }),

  notify,
  check,
  telegramBootstrap,
  telegramSyncMembership,
  telegramCheckoutFreeSubscription,

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
  authenticationBillRoute,
  authenticationOAuthStart,
  authenticationOAuthCallback,
  authenticationOAuthExchange,

  crmModuleFromRequestCreate,

  socialModuleProfileFindByIdChatFind,
  socialModuleProfileFindByIdChatCreate,
  socialModuleProfileFindByIdChatFindById,
  socialModuleProfileFindByIdChatFindByIdMessageFind,
  socialModuleProfileFindByIdChatFindByIdMessageCreate,
  socialModuleProfileFindByIdChatFindByIdThreadFindByIdMessageFind,
  socialModuleProfileFindByIdChatFindByIdThreadFindByIdMessageCreate,
  socialModuleProfileFindByIdChatFindByIdMessageDelete,
  socialModuleProfileFindByIdChatFindByIdMessageUpdate,
  socialModuleProfileFindByIdChatFindByIdMessageFindByIdReactByOpenrouter,
  socialModuleProfileFindByIdChatFindByIdDelete,
  socialModuleProfileFindByIdChatFindByIdActionCreate,
  socialModuleProfileFindByIdChatFindByIdActionFind,
  socialModuleChatCreate,
  socialModuleChatFindByIdThreadFind,
  socialModuleChatFindByIdThreadCreate,
};
