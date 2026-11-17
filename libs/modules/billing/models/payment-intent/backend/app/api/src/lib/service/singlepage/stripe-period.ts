import type Stripe from "stripe";
import { currencyPrecision } from "@sps/billing/models/currency/sdk/model";
import type {
  IProviderPeriodReceipt,
  IProviderPeriodResolver,
} from "./settlement";

export interface IConstructorProps {
  resolve: IProviderPeriodResolver;
  readLines: (invoiceId: string) => Promise<Stripe.InvoiceLineItem[]>;
}

export interface IExecuteProps {
  invoice: Stripe.Invoice;
  subscription: Stripe.Subscription;
  recordedPaymentIntentId?: string;
}

/** Translates authenticated provider facts; the consumer owns local periods. */
export class Service {
  constructor(private readonly dependencies: IConstructorProps) {}

  async execute({
    invoice,
    subscription,
    recordedPaymentIntentId,
  }: IExecuteProps) {
    const contractPaymentIntentId = subscription.metadata?.paymentIntentId;
    if (!contractPaymentIntentId || !subscription.id || !invoice.id) {
      throw new Error(
        "Validation error. Stripe subscription payment intent is missing",
      );
    }
    if (
      invoice.billing_reason !== "subscription_create" &&
      invoice.billing_reason !== "subscription_cycle"
    ) {
      throw new Error(
        "Conflict error. Stripe invoice requires subscription period reconciliation",
      );
    }
    let lines = invoice.lines?.data ?? [];
    if (invoice.lines?.has_more) {
      lines = await this.dependencies.readLines(invoice.id);
    }
    const recurring: Stripe.InvoiceLineItem[] = [];
    let invalidLine = false;
    for (const item of lines) {
      const legacy = item as Stripe.InvoiceLineItem & {
        type?: string;
        proration?: boolean;
        subscription?: string;
      };
      const details = item.parent?.subscription_item_details;
      const oneOff = item.parent?.invoice_item_details;
      if (details || legacy.type === "subscription") {
        recurring.push(item);
      } else if (
        invoice.billing_reason !== "subscription_create" ||
        (!oneOff && legacy.type !== "invoiceitem")
      ) {
        invalidLine = true;
      }
      if (
        details?.proration ||
        oneOff?.proration ||
        legacy.proration ||
        (details?.subscription && details.subscription !== subscription.id) ||
        (oneOff?.subscription && oneOff.subscription !== subscription.id) ||
        (legacy.subscription && legacy.subscription !== subscription.id) ||
        item.currency !== invoice.currency
      ) {
        invalidLine = true;
      }
    }
    const line = recurring[0];
    if (
      recurring.length !== 1 ||
      invalidLine ||
      !line ||
      !Number.isSafeInteger(line.period?.start) ||
      !Number.isSafeInteger(line.period?.end) ||
      line.period.start >= line.period.end ||
      !Number.isSafeInteger(invoice.amount_due) ||
      invoice.amount_due < 0
    ) {
      throw new Error(
        "Conflict error. Stripe invoice requires subscription period reconciliation",
      );
    }
    const invoiceContract =
      invoice.parent?.subscription_details?.metadata?.paymentIntentId;
    if (invoiceContract && invoiceContract !== contractPaymentIntentId) {
      throw new Error(
        "Conflict error. Stripe subscription contract identity changed",
      );
    }
    const receipt: IProviderPeriodReceipt = {
      provider: "stripe",
      contractPaymentIntentId,
      providerSubscriptionId: subscription.id,
      providerInvoiceId: invoice.id,
      periodStart: new Date(line.period.start * 1000).toISOString(),
      periodEnd: new Date(line.period.end * 1000).toISOString(),
      amount: invoice.amount_due / 10 ** currencyPrecision(invoice.currency),
      currency: invoice.currency,
      initial: invoice.billing_reason === "subscription_create",
      ...(recordedPaymentIntentId ? { recordedPaymentIntentId } : {}),
    };
    const result = await this.dependencies.resolve(receipt);
    if (!result?.paymentIntentId) {
      throw new Error(
        "Conflict error. Stripe invoice local subscription period is unresolved",
      );
    }
    let wrongPeriod =
      (receipt.initial && result.paymentIntentId !== contractPaymentIntentId) ||
      (!receipt.initial && result.paymentIntentId === contractPaymentIntentId);
    if (recordedPaymentIntentId) {
      wrongPeriod = result.paymentIntentId !== recordedPaymentIntentId;
    }
    if (wrongPeriod) {
      throw new Error(
        "Conflict error. Stripe invoice must belong to its own local subscription period",
      );
    }
    return result;
  }
}
