import { IResponseProps as IGenerateTelegramEcommerceOrderStatusChangedDefaultProps } from "./generate-telegram-ecommerce-order-status-changed-default";
import { IResponseProps as IGenerateTelegramEcommerceOrderStatusChangedAdminProps } from "./generate-telegram-ecommerce-order-status-changed-admin";
import { IResponseProps as IGenerateTelegramCrmFormRequestCreatedAdminProps } from "./generate-telegram-crm-form-request-created-admin";
import { IResponseProps as IGenerateTelegramSocialModuleMessageCreatedProps } from "./generate-telegram-social-module-message-created";
import { IResponseProps as IGenerateTelegramBillingModulePaymentIntentCreatedDefaultProps } from "./generate-telegram-billing-module-payment-intent-created-default";

export type IComponentProps =
  | IGenerateTelegramEcommerceOrderStatusChangedDefaultProps
  | IGenerateTelegramEcommerceOrderStatusChangedAdminProps
  | IGenerateTelegramCrmFormRequestCreatedAdminProps
  | IGenerateTelegramSocialModuleMessageCreatedProps
  | IGenerateTelegramBillingModulePaymentIntentCreatedDefaultProps;
