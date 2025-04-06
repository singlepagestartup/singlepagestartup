import { IResponseProps as IGenerateTelegramEcommerceOrderStatusChangedDefaultProps } from "./generate-telegram-ecommerce-order-status-changed-default";
import { IResponseProps as IGenerateTelegramEcommerceOrderStatusChangedAdminProps } from "./generate-telegram-ecommerce-order-status-changed-admin";
import { IResponseProps as IGenerateTelegramCrmFormRequestCreatedAdminProps } from "./generate-telegram-crm-form-request-created-admin";

export type IComponentProps =
  | IGenerateTelegramEcommerceOrderStatusChangedDefaultProps
  | IGenerateTelegramEcommerceOrderStatusChangedAdminProps
  | IGenerateTelegramCrmFormRequestCreatedAdminProps;
