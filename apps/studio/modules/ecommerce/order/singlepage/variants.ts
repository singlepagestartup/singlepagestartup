import { Component as AdminV2Card } from "./admin-v2-card/index";
import { Component as AdminV2Table } from "./admin-v2-table/index";
import { Component as CheckoutTokensAiChat } from "./checkout/tokens/ai-chat/index";
import { Component as CheckoutConfirmationDefault } from "./checkout-confirmation-default/index";
import { Component as CheckoutDetailsDefault } from "./checkout-details-default/index";
import { Component as CheckoutPaymentDefault } from "./checkout-payment-default/index";
import { Component as CheckoutStepperDefault } from "./checkout-stepper-default/index";
import { Component as List } from "./list/index";
import { Component as SummaryDefault } from "./summary-default/index";

export const variants = {
  "admin-v2-card": AdminV2Card,
  "admin-v2-table": AdminV2Table,
  "checkout-tokens-ai-chat": CheckoutTokensAiChat,
  "checkout-confirmation-default": CheckoutConfirmationDefault,
  "checkout-details-default": CheckoutDetailsDefault,
  "checkout-payment-default": CheckoutPaymentDefault,
  "checkout-stepper-default": CheckoutStepperDefault,
  list: List,
  "summary-default": SummaryDefault,
};
