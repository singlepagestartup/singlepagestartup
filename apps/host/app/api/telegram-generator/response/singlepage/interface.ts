import { IResponseProps as IGenerateTelegramEcommerceOrderStatusChangedDefaultProps } from "./generate-telegram-ecommerce-order-status-changed-default";
import { IResponseProps as IGenerateTelegramEcommerceOrderStatusChangedAdminProps } from "./generate-telegram-ecommerce-order-status-changed-admin";
import { IResponseProps as IGenerateTelegramCrmFormRequestCreatedAdminProps } from "./generate-telegram-crm-form-request-created-admin";
import { IResponseProps as IGenerateTelegramSocialModuleMessageCreatedProps } from "./generate-telegram-social-module-message-created";

export type IComponentProps =
  | IGenerateTelegramEcommerceOrderStatusChangedDefaultProps
  | IGenerateTelegramEcommerceOrderStatusChangedAdminProps
  | IGenerateTelegramCrmFormRequestCreatedAdminProps
  | IGenerateTelegramSocialModuleMessageCreatedProps;
