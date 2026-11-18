export const variant = "generate-telegram-social-message" as const;
import { IModel as IBillingModulePaymentIntent } from "@sps/billing/models/payment-intent/sdk/model";

export interface IResponseProps {
  variant: typeof variant;
  language: string;
  data: {
    billingModule: {
      paymentIntent: IBillingModulePaymentIntent;
    };
  };
}
