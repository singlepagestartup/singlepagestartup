import { response as generateTelegramEcommerceOrderStatusChangedDefault } from "./generate-telegram-ecommerce-order-status-changed-default";
import { response as generateTelegramEcommerceOrderStatusChangedAdmin } from "./generate-telegram-ecommerce-order-status-changed-admin";
import { response as generateTelegramCrmFormRequestCreatedAdmin } from "./generate-telegram-crm-form-request-created-admin";
import { response as generateTelegramSocialModuleMessageCreated } from "./generate-telegram-social-module-message-created";
import { response as generateTelegramBillingModulePaymentIntentCreatedDefault } from "./generate-telegram-billing-module-payment-intent-created-default";

export const variants = {
  "generate-telegram-ecommerce-order-status-changed-default":
    generateTelegramEcommerceOrderStatusChangedDefault,
  "generate-telegram-ecommerce-order-status-changed-admin":
    generateTelegramEcommerceOrderStatusChangedAdmin,
  "generate-telegram-crm-form-request-created-admin":
    generateTelegramCrmFormRequestCreatedAdmin,
  "generate-telegram-social-module-message-created":
    generateTelegramSocialModuleMessageCreated,
  "generate-telegram-billing-module-payment-intent-created-default":
    generateTelegramBillingModulePaymentIntentCreatedDefault,
};
