import type Stripe from "stripe";
import type { IModel as IInvoice } from "@sps/billing/models/invoice/sdk/model";
import type { Service as Subject } from "../../index";

export class Service {
  constructor(
    private readonly subject: Pick<
      Subject,
      "billingModule" | "ecommerceModuleOrderResolveProviderPeriod"
    >,
  ) {}

  private get payments() {
    return this.subject.billingModule.paymentIntent;
  }

  async webhook(event: Stripe.Response<Stripe.Event>) {
    const remote = event.data.object;
    if (remote.object !== "invoice") {
      return this.payments.stripe({ action: "webhook", data: event });
    }
    if (remote.status === "draft") {
      return { pending: true };
    }
    return this.receive(remote);
  }

  async check(invoice: IInvoice) {
    if (invoice.status === "draft" && !invoice.providerId) {
      const links =
        await this.payments.billingModule.paymentIntentsToInvoices.find({
          params: {
            filters: {
              and: [{ column: "invoiceId", method: "eq", value: invoice.id }],
            },
          },
        });
      if (links?.length === 1) {
        const intent = await this.payments.findById({
          id: links[0].paymentIntentId,
        });
        const contractId =
          intent?.checkoutMetadata?.providerContractPaymentIntentId;
        if (typeof contractId === "string") {
          await this.reconcile({ id: contractId });
        }
      }
      return;
    }
    const subscription = await this.payments.checkStripeInvoiceStatus(invoice);
    if (subscription) {
      await this.receive(subscription.remote, subscription.stripe);
    }
  }

  async reconcile(props: { id: string }) {
    for await (const {
      stripe,
      remote,
      subscription,
    } of this.payments.stripeSubscriptionInvoices(props)) {
      await this.receive(remote, stripe, subscription);
    }
  }

  private async receive(
    remote: Stripe.Invoice,
    stripe?: Stripe,
    subscription?: Stripe.Subscription,
  ) {
    const { receipt, recorded } = await this.payments.readStripeOrderPeriod(
      remote,
      stripe,
      subscription,
    );
    const result =
      await this.subject.ecommerceModuleOrderResolveProviderPeriod(receipt);
    if (!result?.paymentIntentId) {
      throw new Error(
        "Conflict error. Stripe invoice local subscription period is unresolved",
      );
    }
    let wrongPeriod =
      (receipt.initial &&
        result.paymentIntentId !== receipt.contractPaymentIntentId) ||
      (!receipt.initial &&
        result.paymentIntentId === receipt.contractPaymentIntentId);
    if (receipt.recordedPaymentIntentId) {
      wrongPeriod = result.paymentIntentId !== receipt.recordedPaymentIntentId;
    }
    if (wrongPeriod) {
      throw new Error(
        "Conflict error. Stripe invoice must belong to its own local subscription period",
      );
    }
    if (recorded) {
      return recorded;
    }
    return this.payments.settleStripeSubscriptionInvoice(
      remote,
      result.paymentIntentId,
      true,
    );
  }
}
