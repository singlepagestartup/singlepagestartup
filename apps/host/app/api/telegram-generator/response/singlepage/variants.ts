import { response as generateTelegramEcommerceOrderStatusChangedDefault } from "./generate-telegram-ecommerce-order-status-changed-default";
import { response as generateTelegramEcommerceOrderStatusChangedAdmin } from "./generate-telegram-ecommerce-order-status-changed-admin";
import { response as generateTelegramCrmFormRequestCreatedAdminProps } from "./generate-telegram-crm-form-request-created-admin";

export const variants = {
  "generate-telegram-ecommerce-order-status-changed-default":
    generateTelegramEcommerceOrderStatusChangedDefault,
  "generate-telegram-ecommerce-order-status-changed-admin":
    generateTelegramEcommerceOrderStatusChangedAdmin,
  "generate-telegram-crm-form-request-created-admin":
    generateTelegramCrmFormRequestCreatedAdminProps,
};
