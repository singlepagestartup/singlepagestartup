import type { z } from "zod";
import type { outputSchema } from "@sps/billing/models/payment-intent/backend/repository/database";
export type IModel = z.infer<typeof outputSchema>;
export {
  type IInsertSchema,
  type ISelectSchema as IInternalModel,
  insertSchema,
  selectSchema,
  outputSchema,
} from "@sps/billing/models/payment-intent/backend/repository/database";
import {
  API_SERVICE_URL,
  NEXT_PUBLIC_API_SERVICE_URL,
  NextRequestOptions,
  REVALIDATE,
} from "@sps/shared-utils";
import {
  currencyPrecision,
  type ICurrencyPrecisionInput,
} from "@sps/billing/models/currency/sdk/model";

export function paymentProviderPrecision(
  provider: string,
  currency: string | ICurrencyPrecisionInput,
): number {
  const precision = currencyPrecision(currency);
  if (provider === "telegram-star") {
    return 0;
  }
  if (provider === "dummy") {
    return precision;
  }
  if (provider === "stripe" && precision !== 2) {
    throw new Error(
      "Validation error. This Stripe adapter supports currencies with two decimal places; choose another payment provider",
    );
  }
  if (
    [
      "stripe",
      "cloudpayments",
      "tiptoppay",
      "paykeeper",
      "0xprocessing",
    ].includes(provider) ||
    provider.startsWith("payselection")
  ) {
    return 2;
  }
  return precision;
}

export const serverHost = API_SERVICE_URL;
export const clientHost = NEXT_PUBLIC_API_SERVICE_URL;
export const route = "/api/billing/payment-intents";
export const variants = ["hidden", "default"];
export const types = ["one_off", "subscription"];
export const intervals = ["day", "week", "four_weeks", "month", "year"];
export const statuses = [
  "processing",
  "requires_action",
  "requires_capture",
  "requires_confirmation",
  "requires_payment_method",
  "succeeded",
  "failed",
  "canceled",
  "requires_reconciliation",
];
export function isConfirmedInvoice(
  intent: { status: string },
  invoice: { status: string } | null | undefined,
): boolean {
  return intent.status === "succeeded" && invoice?.status === "paid";
}

export const query = {};
export const options = {
  next: {
    revalidate: REVALIDATE,
  },
} as NextRequestOptions;
