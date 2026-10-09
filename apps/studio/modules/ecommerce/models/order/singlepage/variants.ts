import { Component as AdminV2Card } from "./admin-v2-card/index";
import { Component as AdminV2Table } from "./admin-v2-table/index";
import { Component as AiChatTokens } from "./ai-chat-tokens/index";
import { Component as CheckoutConfirmationDefault } from "./checkout-confirmation-default/index";
import { Component as CheckoutDetailsDefault } from "./checkout-details-default/index";
import { Component as CheckoutPaymentDefault } from "./checkout-payment-default/index";
import { Component as CheckoutStepperDefault } from "./checkout-stepper-default/index";
import { Component as Find } from "./find/index";
import { Component as SummaryDefault } from "./summary-default/index";

export const variants = {
  "admin-v2-card": AdminV2Card,
  "admin-v2-table": AdminV2Table,
  "ai-chat-tokens": AiChatTokens,
  "checkout-confirmation-default": CheckoutConfirmationDefault,
  "checkout-details-default": CheckoutDetailsDefault,
  "checkout-payment-default": CheckoutPaymentDefault,
  "checkout-stepper-default": CheckoutStepperDefault,
  find: Find,
  "summary-default": SummaryDefault,
};
