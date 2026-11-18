import { z } from "zod";
import { Service as Settlement } from "../startup/settlement";
import { Service as PaykeeperSettlement } from "../startup/paykeeper-settlement";
import type {
  IExecuteProps as ISettlementProps,
  IExpireProps,
} from "./settlement";
import "reflect-metadata";
import { inject, injectable } from "inversify";
import { CRUDService, DI, consistencyContext } from "@sps/shared-backend-api";
import {
  Table,
  privateCheckoutFields,
} from "@sps/billing/models/payment-intent/backend/repository/database";
import { Repository } from "../../repository";
import { Service as CheckoutDispatch } from "../startup/checkout-dispatch";
import { Service as StripePeriod } from "../startup/stripe-period";
import type { IPrepareCheckoutDispatch } from "./checkout-dispatch";
import Stripe from "stripe";
import {
  STRIPE_RETURN_URL,
  O_X_PROCESSING_RETURN_URL,
  O_X_PROCESSING_SHOP_ID,
  O_X_PROCESSING_TEST_PAYMENTS,
  O_X_PROCESSING_WEBHOOK_PASSWORD,
  PAYSELECTION_RUB_PUBLIC_KEY,
  PAYSELECTION_RUB_SECRET_KEY,
  PAYSELECTION_RUB_SITE_ID,
  PAYSELECTION_RUB_SITE_NAME,
  PAYSELECTION_RUB_WEBHOOK_URL,
  RBAC_SECRET_KEY,
  STRIPE_SECRET_KEY,
  PAYSELECTION_INT_PUBLIC_KEY,
  PAYSELECTION_INT_SITE_ID,
  PAYSELECTION_INT_SECRET_KEY,
  PAYSELECTION_INT_SITE_NAME,
  PAYSELECTION_INT_WEBHOOK_URL,
  NEXT_PUBLIC_HOST_SERVICE_URL,
  ALLOWED_BILLING_SERVICE_PROVIDERS,
} from "@sps/shared-utils";
import { api as paymentIntentsToInvoicesApi } from "@sps/billing/relations/payment-intents-to-invoices/sdk/server";
import { api as invoiceApi } from "@sps/billing/models/invoice/sdk/server";
import { IModel as IInvoice } from "@sps/billing/models/invoice/sdk/model";
import * as crypto from "crypto";
import { Service as Cloudpayments } from "../startup/cloudpayments";
import type { IServiceProceedProps as ICloudpaymentsProceedProps } from "./cloudpayments";
import { Service as Tiptoppay } from "../startup/tiptoppay";
import type { IServiceProceedProps as ITiptippayProceedProps } from "./tiptoppay";
import { Service as Paykeeper } from "../startup/paykeeper";
import type { IServiceProceedProps as IPaykeeperProceedProps } from "./paykeeper";
import { Service as TelegramStar } from "../startup/telegram-star";
import type { IServiceProceedProps as ITelegramStarProps } from "./telegram-star";
import {
  logger,
  parseExactMonetaryAmount,
  providerMinorUnits,
} from "@sps/backend-utils";
import { currencyPrecision } from "@sps/billing/models/currency/sdk/model";
import { PaymentIntentDI, type IBillingModule } from "../../di";

interface IStripeInvoiceProps {
  paymentIntentId: string;
  providerId: string;
  amount: number;
  currency?: string;
  firstPeriodOnly?: boolean;
  usePreparedInvoice?: boolean;
  paymentUrl?: string;
  successUrl?: string | null;
  cancelUrl?: string | null;
}

@injectable()
export class Service extends CRUDService<(typeof Table)["$inferSelect"]> {
  declare repository: Repository;
  billingModule: IBillingModule;
  protected readonly usesPreparedCheckoutInvoice: boolean = false;
  private readonly checkoutDispatch: CheckoutDispatch;

  constructor(
    @inject(DI.IRepository) repository: Repository,
    @inject(PaymentIntentDI.IBillingModule) billingModule: IBillingModule,
  ) {
    super(repository);
    this.billingModule = billingModule;
    this.checkoutDispatch = new CheckoutDispatch(repository);
  }

  /**
   * Whether the provider is an entry of `ALLOWED_BILLING_SERVICE_PROVIDERS`.
   * Payment creation and provider webhooks both refuse a provider this
   * returns false for, so the list turns a provider on or off for both routes.
   */
  isProviderAllowed(props: { provider: string }) {
    return ALLOWED_BILLING_SERVICE_PROVIDERS.split(",").includes(
      props.provider,
    );
  }

  /** Whether the adapter owns future subscription payment scheduling. */
  schedulesSubscriptionPayments(props: { provider: string }): boolean {
    return props.provider === "stripe";
  }

  protected get settlement() {
    return new Settlement({ repository: this.repository, service: this });
  }

  settlePayment(props: ISettlementProps) {
    return this.settlement.execute(props);
  }

  protected override insert(data: Record<string, unknown>) {
    return super.insert(this.checkoutDispatch.writableData(data));
  }

  override update(props: {
    id: string;
    data: Partial<typeof Table.$inferSelect>;
  }) {
    if (
      props.data.amount === undefined &&
      !privateCheckoutFields.some((field) => field in props.data)
    ) {
      return super.update(props);
    }
    // Serialize amount changes with checkout preparation on this same intent.
    return this.repository.withPaymentIntentLock(props.id, async () => {
      const intent = await this.findById({ id: props.id });
      const data = this.checkoutDispatch.writableData(props.data, intent);
      return super.update({
        id: props.id,
        data,
      });
    });
  }

  prepareCheckoutDispatch(props: IPrepareCheckoutDispatch) {
    return this.checkoutDispatch.prepare(props);
  }

  claimCheckoutDispatch(props: { id: string; provider: string }) {
    return this.repository.withPaymentIntentLock(props.id, () =>
      this.checkoutDispatch.claim(props),
    );
  }

  markCheckoutExposed(props: { id: string }) {
    return this.repository.withPaymentIntentLock(props.id, () =>
      this.checkoutDispatch.markExposed(props.id),
    );
  }

  protected async subscriptionRenewalContext(props: { id: string }) {
    const intent = await this.findById(props);
    if (!intent) {
      throw new Error("Not Found error. Payment intent not found");
    }
    if (intent.type !== "subscription" || intent.amount === 0) {
      return;
    }
    const links = await this.billingModule.paymentIntentsToInvoices.find({
      params: {
        filters: {
          and: [{ column: "paymentIntentId", method: "eq", value: intent.id }],
        },
      },
    });
    const invoices = await this.billingModule.invoice.find({
      params: {
        filters: {
          and: [
            {
              column: "id",
              method: "inArray",
              value: links.map((link) => link.invoiceId),
            },
            { column: "status", method: "eq", value: "paid" },
          ],
        },
      },
    });
    const paid = invoices.filter(
      (invoice) =>
        links.some((link) => link.invoiceId === invoice.id) &&
        invoice.status === "paid",
    );
    if (!paid.length) {
      throw new Error(
        "Validation error. Recurring payment has no confirmed provider invoice",
      );
    }
    const localProviders = [
      "cloudpayments",
      "tiptoppay",
      "0xprocessing",
      "payselection",
      "paykeeper",
      "telegram-star",
      "dummy",
    ];
    if (
      paid.every((invoice) => localProviders.includes(invoice.provider ?? ""))
    ) {
      return;
    }
    return { intent, paid };
  }

  async hasProviderManagedSubscriptionRenewal(props: { id: string }) {
    const context = await this.subscriptionRenewalContext(props);
    return Boolean(context);
  }

  /** Stops future provider charges without changing confirmed Invoice history. */
  async stopSubscriptionRenewal(props: { id: string }) {
    const context = await this.subscriptionRenewalContext(props);
    if (!context) {
      return;
    }
    const { intent, paid } = context;
    if (paid.some((invoice) => invoice.provider !== "stripe")) {
      throw new Error(
        "Configuration error. Recurring payment provider cannot stop renewal automatically",
      );
    }
    if (!STRIPE_SECRET_KEY) {
      throw new Error("Configuration error. Stripe secret key not found");
    }
    if (consistencyContext.getStore()?.database) {
      throw new Error(
        "Conflict error. Provider cancellation requires a committed transaction",
      );
    }
    const stripe = new Stripe(STRIPE_SECRET_KEY);
    const subscriptionIds = new Set<string>();
    for (const invoice of paid) {
      if (!invoice.providerId) {
        throw new Error(
          "Validation error. Stripe invoice provider ID is missing",
        );
      }
      const remote = await stripe.invoices.retrieve(invoice.providerId);
      const reference = remote.parent?.subscription_details?.subscription;
      const subscriptionId =
        reference ??
        ("subscription" in remote ? remote.subscription : undefined);
      if (typeof subscriptionId !== "string") {
        throw new Error(
          "Validation error. Stripe invoice subscription is missing",
        );
      }
      subscriptionIds.add(subscriptionId);
    }
    for (const id of subscriptionIds) {
      const subscription = await stripe.subscriptions.retrieve(id);
      const contractId =
        intent.checkoutMetadata?.providerContractPaymentIntentId ?? intent.id;
      if (subscription.metadata?.paymentIntentId !== contractId) {
        throw new Error(
          "Permission error. Stripe subscription belongs to another payment intent",
        );
      }
      if (
        subscription.status !== "canceled" &&
        !subscription.cancel_at_period_end
      ) {
        await stripe.subscriptions.update(id, { cancel_at_period_end: true });
      }
    }
  }

  async settleFreePayment(id: string, provider: string) {
    return this.repository.withPaymentIntentLock(id, async () => {
      const intent = await this.findById({ id });
      if (!intent) {
        throw new Error("Not Found error. Payment intent not found");
      }
      if (intent.amount !== 0 || intent.status === "canceled") {
        throw new Error(
          "Conflict error. Payment intent cannot be settled as free",
        );
      }
      if (intent.status === "succeeded") {
        return intent;
      }
      if (intent.type === "subscription") {
        await this.update({ id, data: { ...intent, type: "one_off" } });
      }
      const { invoice, paymentIntentsToInvoices } = this.billingModule;
      const links = await paymentIntentsToInvoices.find({
        params: {
          filters: {
            and: [{ column: "paymentIntentId", method: "eq", value: id }],
          },
        },
      });
      let freeInvoice: IInvoice | undefined;
      if (links.length) {
        const matches = await invoice.find({
          params: {
            filters: {
              and: [
                {
                  column: "id",
                  method: "inArray",
                  value: links.map((link) => link.invoiceId),
                },
                { column: "provider", method: "eq", value: provider },
                { column: "amount", method: "eq", value: 0 },
                { column: "status", method: "eq", value: "open" },
              ],
            },
          },
        });
        freeInvoice = matches[0];
      }
      if (!freeInvoice) {
        freeInvoice = await invoice.create({
          data: { amount: 0, status: "open", provider },
        });
        await paymentIntentsToInvoices.create({
          data: { paymentIntentId: id, invoiceId: freeInvoice.id },
        });
      }
      await this.settlePayment({
        invoiceId: freeInvoice.id,
        provider,
        paymentIntentId: id,
        amount: 0,
      });
      return this.findById({ id });
    });
  }

  expireInvoice(props: IExpireProps) {
    return this.settlement.expire(props);
  }

  async failUninitializedPaymentIntent(id: string, expiresBefore: Date) {
    return this.repository.withPaymentIntentLock(id, async () => {
      const intent = await this.findById({ id });
      if (!intent) throw new Error("Not Found error. Payment intent not found");
      if (
        ["succeeded", "failed", "canceled"].includes(intent.status) ||
        new Date(intent.updatedAt ?? intent.createdAt) >= expiresBefore
      )
        return intent;
      const links = await this.billingModule.paymentIntentsToInvoices.find({
        params: {
          filters: {
            and: [{ column: "paymentIntentId", method: "eq", value: id }],
          },
        },
      });
      if (links?.length) return intent;
      return this.update({ id, data: { ...intent, status: "failed" } });
    });
  }

  // Compatibility entrypoint for project callers; always rereads the committed invoice.
  async updatePaymentIntentStatus(props: { invoice: IInvoice }) {
    const invoice = await this.billingModule.invoice.findById({
      id: props.invoice.id,
    });
    if (!invoice || invoice.status !== "paid" || !invoice.provider)
      throw new Error("Conflict error. Invoice is not paid");
    await this.settlePayment({
      invoiceId: invoice.id,
      provider: invoice.provider,
      providerId: invoice.providerId,
      amount: invoice.amount,
    });
    return { ok: true };
  }

  private withStripeInvoice(
    props: IStripeInvoiceProps,
    operation: (invoice: IInvoice) => Promise<IInvoice>,
  ) {
    return this.repository.withPaymentIntentLock(
      props.paymentIntentId,
      async () => {
        const intent = await this.findById({ id: props.paymentIntentId });
        if (!intent) {
          throw new Error("Not Found error. Payment intent not found");
        }
        if (!props.providerId || parseExactMonetaryAmount(props.amount) < 0) {
          throw new Error("Validation error. Invalid Stripe invoice");
        }
        if (
          parseExactMonetaryAmount(intent.amount) !==
          parseExactMonetaryAmount(props.amount)
        ) {
          throw new Error(
            "Conflict error. Stripe invoice amount differs from its local payment intent",
          );
        }
        if (props.currency && intent.checkoutCurrencyId) {
          const currency = await this.billingModule.currency.findById({
            id: intent.checkoutCurrencyId,
          });
          if (!currency || currency.slug !== props.currency) {
            throw new Error(
              "Conflict error. Stripe invoice currency differs from its saved checkout",
            );
          }
        }
        const invoices = await this.billingModule.invoice.find({
          params: {
            filters: {
              and: [
                { column: "provider", method: "eq", value: "stripe" },
                { column: "providerId", method: "eq", value: props.providerId },
              ],
            },
          },
        });
        if (invoices && invoices.length > 1) {
          throw new Error("Conflict error. Multiple Stripe invoices found");
        }
        let invoice = invoices?.[0];
        if (
          props.firstPeriodOnly &&
          ["succeeded", "requires_reconciliation"].includes(intent.status) &&
          invoice?.status !== "paid"
        ) {
          throw new Error(
            "Conflict error. Initial Stripe subscription payment was already settled",
          );
        }
        if (
          !invoice &&
          (props.usePreparedInvoice || this.usesPreparedCheckoutInvoice)
        ) {
          if (intent.status === "canceled") {
            throw new Error(
              "Conflict error. Canceled subscription period requires payment reconciliation",
            );
          }
          const intentLinks =
            await this.billingModule.paymentIntentsToInvoices.find({
              params: {
                filters: {
                  and: [
                    {
                      column: "paymentIntentId",
                      method: "eq",
                      value: intent.id,
                    },
                  ],
                },
              },
            });
          if (intentLinks?.length) {
            const pending = await this.billingModule.invoice.find({
              params: {
                filters: {
                  and: [
                    {
                      column: "id",
                      method: "inArray",
                      value: intentLinks.map((link) => link.invoiceId),
                    },
                    { column: "provider", method: "eq", value: "stripe" },
                  ],
                },
              },
            });
            if (
              pending.some(
                (item) =>
                  item.provider === "stripe" &&
                  !item.providerId &&
                  item.status !== "draft",
              )
            ) {
              throw new Error(
                "Conflict error. Closed subscription period invoice requires payment reconciliation",
              );
            }
            const drafts = pending.filter(
              (item) =>
                item.provider === "stripe" &&
                item.status === "draft" &&
                !item.providerId &&
                intentLinks.some((link) => link.invoiceId === item.id),
            );
            if (drafts.length > 1) {
              throw new Error(
                "Conflict error. Multiple pending Stripe period invoices found",
              );
            }
            const draft = drafts[0];
            if (draft) {
              if (
                parseExactMonetaryAmount(draft.amount) !==
                parseExactMonetaryAmount(props.amount)
              ) {
                throw new Error(
                  "Conflict error. Stripe invoice amount differs from its prepared period invoice",
                );
              }
              const updated = await this.billingModule.invoice.update({
                id: draft.id,
                data: {
                  ...draft,
                  providerId: props.providerId,
                  status: "open",
                  paymentUrl: props.paymentUrl || "",
                },
              });
              if (!updated) {
                throw new Error("Not Found error. Invoice not found");
              }
              invoice = updated;
            }
          }
        }
        if (!invoice) {
          invoice = await this.billingModule.invoice.create({
            data: {
              provider: "stripe",
              providerId: props.providerId,
              amount: props.amount,
              status: "open",
              paymentUrl: props.paymentUrl || "",
              successUrl: props.successUrl || "",
              cancelUrl: props.cancelUrl || "",
            },
          });
        }
        if (
          parseExactMonetaryAmount(invoice.amount) !==
          parseExactMonetaryAmount(props.amount)
        ) {
          throw new Error("Conflict error. Stripe invoice amount changed");
        }
        const links = await this.billingModule.paymentIntentsToInvoices.find({
          params: {
            filters: {
              and: [{ column: "invoiceId", method: "eq", value: invoice.id }],
            },
          },
        });
        if (links?.length) {
          if (links.length !== 1 || links[0].paymentIntentId !== intent.id) {
            throw new Error(
              "Conflict error. Stripe invoice belongs to another payment intent",
            );
          }
        } else {
          const link = await this.billingModule.paymentIntentsToInvoices.create(
            {
              data: {
                invoiceId: invoice.id,
                paymentIntentId: intent.id,
              },
            },
          );
          if (!link) {
            throw new Error("Internal error. Failed to link Stripe invoice");
          }
        }
        return operation(invoice);
      },
    );
  }

  private async applyStripePaymentStatus(
    invoice: IInvoice,
    remote: Stripe.Checkout.Session | Stripe.Invoice,
    options: { failedAsyncPayment?: boolean; paymentIntentId?: string } = {},
  ) {
    if (invoice.provider !== "stripe" || invoice.providerId !== remote.id) {
      throw new Error("Conflict error. Stripe invoice reference changed");
    }
    const reference = {
      invoiceId: invoice.id,
      provider: "stripe" as const,
      providerId: remote.id,
    };
    const session = remote.object === "checkout.session";
    if (
      (session &&
        remote.status === "complete" &&
        (remote.payment_status === "paid" ||
          remote.payment_status === "no_payment_required")) ||
      (!session && remote.status === "paid")
    ) {
      const amount = session ? remote.amount_total : remote.amount_paid;
      if (amount === null) {
        throw new Error("Validation error. Stripe amount is missing");
      }
      return this.settlePayment({
        ...reference,
        amount: amount / 10 ** currencyPrecision(remote.currency ?? "usd"),
        paymentIntentId: options.paymentIntentId,
      });
    }
    if (
      (session &&
        (remote.status === "expired" ||
          (remote.status === "complete" && options.failedAsyncPayment))) ||
      (!session && remote.status === "void")
    ) {
      await this.expireInvoice(reference);
      const current = await this.billingModule.invoice.findById({
        id: invoice.id,
      });
      if (!current) {
        throw new Error("Not Found error. Invoice not found");
      }
      return current;
    } else if (session && remote.status === "complete" && invoice.paymentUrl) {
      // Checkout is closed to the buyer while an asynchronous payment is pending.
      return this.settlement.closeStripePaymentPage(reference);
    }
    return invoice;
  }

  async getStripePaymentEvent(id: unknown) {
    if (!STRIPE_SECRET_KEY) {
      throw new Error("Configuration error. Stripe secret key not found");
    }
    if (typeof id !== "string" || !/^evt_[a-zA-Z0-9]+$/.test(id)) {
      throw new Error("Validation error. Invalid Stripe event ID");
    }

    const stripe = new Stripe(STRIPE_SECRET_KEY);
    const event = await stripe.events.retrieve(id);
    if (
      !event ||
      event.id !== id ||
      event.object !== "event" ||
      typeof event.type !== "string" ||
      !event.data?.object ||
      typeof event.data.object.object !== "string"
    ) {
      throw new Error("Validation error. Invalid retrieved Stripe event");
    }
    const object = event.data.object.object;
    const invoice =
      object === "invoice" &&
      [
        "invoice.created",
        "invoice.finalized",
        "invoice.paid",
        "invoice.payment_succeeded",
        "invoice.payment_failed",
        "invoice.voided",
        "invoice.marked_uncollectible",
        "invoice.finalization_failed",
      ].includes(event.type);
    const checkout =
      object === "checkout.session" &&
      [
        "checkout.session.completed",
        "checkout.session.async_payment_succeeded",
        "checkout.session.async_payment_failed",
        "checkout.session.expired",
      ].includes(event.type);
    if (invoice || checkout) {
      if (
        !("id" in event.data.object) ||
        typeof event.data.object.id !== "string" ||
        !event.data.object.id
      ) {
        throw new Error("Validation error. Missing Stripe payment identity");
      }
      return event;
    }
    return;
  }

  async checkStripeInvoice(invoice: IInvoice) {
    const subscription = await this.checkStripeInvoiceStatus(invoice);
    if (subscription) {
      await this.receiveInitialStripeInvoice(
        subscription.stripe,
        subscription.remote,
      );
    }
  }

  async checkStripeInvoiceStatus(invoice: IInvoice) {
    if (invoice.status !== "open" || !invoice.providerId) {
      return;
    }
    if (!STRIPE_SECRET_KEY) {
      throw new Error("Configuration error. Stripe secret key not found");
    }
    const stripe = new Stripe(STRIPE_SECRET_KEY);
    if (invoice.providerId.startsWith("cs_")) {
      const session = await stripe.checkout.sessions.retrieve(
        invoice.providerId,
      );
      await this.applyStripePaymentStatus(invoice, session);
    } else if (invoice.providerId.startsWith("in_")) {
      const remote = await stripe.invoices.retrieve(invoice.providerId);
      const subscription =
        remote.parent?.subscription_details?.subscription ??
        ("subscription" in remote ? remote.subscription : undefined);
      if (subscription || remote.billing_reason?.startsWith("subscription_")) {
        return { stripe, remote };
      } else {
        await this.applyStripePaymentStatus(invoice, remote);
      }
    }
    return;
  }

  private async readStripeSubscriptionInvoice(
    stripe: Stripe,
    remote: Stripe.Invoice,
    subscription?: Stripe.Subscription,
  ) {
    const reference = remote.parent?.subscription_details?.subscription;
    const subscriptionId =
      reference ?? ("subscription" in remote ? remote.subscription : undefined);
    if (typeof subscriptionId !== "string") {
      throw new Error(
        "Validation error. Stripe invoice subscription is missing",
      );
    }
    const contract =
      subscription ?? (await stripe.subscriptions.retrieve(subscriptionId));
    if (contract.id && contract.id !== subscriptionId) {
      throw new Error("Conflict error. Stripe subscription identity changed");
    }
    const paymentIntentId = contract.metadata?.paymentIntentId;
    if (!paymentIntentId) {
      throw new Error(
        "Validation error. Stripe subscription payment intent is missing",
      );
    }
    // Historic subscribers can retain earlier paid invoices on their original
    // intent. A replay preserves that history without allocating a new period.
    const recorded = await this.billingModule.invoice.find({
      params: {
        filters: {
          and: [
            { column: "provider", method: "eq", value: "stripe" },
            { column: "providerId", method: "eq", value: remote.id },
          ],
        },
      },
    });
    if (recorded.length > 1) {
      throw new Error("Conflict error. Multiple Stripe invoices found");
    }
    const paid = recorded[0];
    if (paid?.status === "paid") {
      const links = await this.billingModule.paymentIntentsToInvoices.find({
        params: {
          filters: {
            and: [{ column: "invoiceId", method: "eq", value: paid.id }],
          },
        },
      });
      if (links.length === 1) {
        const intent = await this.findById({ id: links[0].paymentIntentId });
        const contractId =
          intent?.checkoutMetadata?.providerContractPaymentIntentId ??
          intent?.id;
        const remoteAmount =
          remote.status === "paid" ? remote.amount_paid : remote.amount_due;
        if (
          intent?.status === "succeeded" &&
          contractId === paymentIntentId &&
          parseExactMonetaryAmount(paid.amount) ===
            remoteAmount / 10 ** currencyPrecision(remote.currency ?? "usd")
        ) {
          return {
            contract,
            paymentIntentId,
            recorded: { invoice: paid, paymentIntentId: intent.id },
          };
        }
      }
    }
    return { contract, paymentIntentId };
  }

  async readStripeOrderPeriod(
    remote: Stripe.Invoice,
    client?: Stripe,
    subscription?: Stripe.Subscription,
  ) {
    if (!STRIPE_SECRET_KEY) {
      throw new Error("Configuration error. Stripe secret key not found");
    }
    const stripe = client ?? new Stripe(STRIPE_SECRET_KEY);
    const { contract, recorded } = await this.readStripeSubscriptionInvoice(
      stripe,
      remote,
      subscription,
    );
    const receipt = await new StripePeriod({
      readLines: async (invoiceId) => {
        const lines: Stripe.InvoiceLineItem[] = [];
        for await (const line of stripe.invoices.listLineItems(invoiceId, {
          limit: 100,
        })) {
          lines.push(line);
        }
        return lines;
      },
    }).execute({
      invoice: remote,
      subscription: contract,
      recordedPaymentIntentId: recorded?.paymentIntentId,
    });
    return { receipt, recorded: recorded?.invoice };
  }

  private async receiveInitialStripeInvoice(
    stripe: Stripe,
    remote: Stripe.Invoice,
  ) {
    const { paymentIntentId, recorded } =
      await this.readStripeSubscriptionInvoice(stripe, remote);
    if (recorded) {
      return recorded.invoice;
    }
    if (remote.billing_reason !== "subscription_create") {
      throw new Error(
        "Conflict error. Stripe renewal requires its own period order",
      );
    }
    return this.settleStripeSubscriptionInvoice(remote, paymentIntentId, false);
  }

  async settleStripeSubscriptionInvoice(
    remote: Stripe.Invoice,
    paymentIntentId: string,
    preparedPeriod: boolean,
  ) {
    return this.withStripeInvoice(
      {
        paymentIntentId,
        providerId: remote.id,
        amount:
          remote.amount_due / 10 ** currencyPrecision(remote.currency ?? "usd"),
        currency: remote.currency,
        firstPeriodOnly: !preparedPeriod,
        usePreparedInvoice: preparedPeriod,
        paymentUrl: remote.hosted_invoice_url ?? "",
      },
      (invoice) =>
        this.applyStripePaymentStatus(invoice, remote, { paymentIntentId }),
    );
  }

  /** Reads provider-owned debits after a lost notification; never submits one. */
  async *stripeSubscriptionInvoices(props: { id: string }) {
    if (consistencyContext.getStore()?.database) {
      throw new Error(
        "Conflict error. Provider reconciliation requires a committed transaction",
      );
    }
    const context = await this.subscriptionRenewalContext(props);
    if (
      !context ||
      context.paid.some((invoice) => invoice.provider !== "stripe")
    ) {
      return;
    }
    if (!STRIPE_SECRET_KEY) {
      throw new Error("Configuration error. Stripe secret key not found");
    }
    const stripe = new Stripe(STRIPE_SECRET_KEY);
    const subscriptions = new Set<string>();
    for (const invoice of context.paid) {
      if (!invoice.providerId) {
        throw new Error(
          "Validation error. Stripe invoice provider ID is missing",
        );
      }
      const remote = await stripe.invoices.retrieve(invoice.providerId);
      const reference = remote.parent?.subscription_details?.subscription;
      const id =
        reference ??
        ("subscription" in remote ? remote.subscription : undefined);
      if (typeof id !== "string") {
        throw new Error(
          "Validation error. Stripe invoice subscription is missing",
        );
      }
      subscriptions.add(id);
    }
    for (const id of subscriptions) {
      const subscription = await stripe.subscriptions.retrieve(id);
      const contractId =
        context.intent.checkoutMetadata?.providerContractPaymentIntentId ??
        context.intent.id;
      if (subscription.metadata?.paymentIntentId !== contractId) {
        throw new Error(
          "Permission error. Stripe subscription belongs to another payment intent",
        );
      }
      const invoices: Stripe.Invoice[] = [];
      for await (const invoice of stripe.invoices.list({
        subscription: id,
        limit: 100,
      })) {
        invoices.push(invoice);
      }
      invoices.sort(
        (left, right) =>
          left.created - right.created || left.id.localeCompare(right.id),
      );
      for (const remote of invoices) {
        if (
          (remote.billing_reason === "subscription_create" ||
            remote.billing_reason === "subscription_cycle") &&
          remote.status !== "draft"
        ) {
          yield { stripe, remote, subscription };
        }
      }
    }
  }

  async stripe(
    props:
      | {
          entity: (typeof Table)["$inferSelect"];
          action: "create";
          email: string;
          currency: string;
          metadata: {
            email: string;
            paymentIntentId: string;
          };
        }
      | {
          action: "webhook";
          data: Stripe.Response<Stripe.Event>;
        },
  ) {
    if (!RBAC_SECRET_KEY) {
      throw new Error("Configuration error. RBAC secret key not found");
    }

    if (!STRIPE_SECRET_KEY) {
      throw new Error("Configuration error. Stripe secret key not found");
    }

    const stripe = new Stripe(STRIPE_SECRET_KEY);

    if (props.action === "create") {
      if (props.entity.checkoutMetadata?.providerContractPaymentIntentId) {
        throw new Error(
          "Conflict error. Subscription period payment is managed by its existing provider contract",
        );
      }
      if (!props.entity.amount) {
        throw new Error("Validation error. Amount is required");
      }

      if (props.entity.amount < 0) {
        throw new Error("Validation error. Amount cannot be negative");
      }
      let recurringAmount = props.entity.amount;
      if (
        props.entity.type === "subscription" &&
        props.entity.checkoutMetadata?.providerRecurringAmount !== undefined
      ) {
        const saved = props.entity.checkoutMetadata.providerRecurringAmount;
        if (
          typeof saved !== "number" ||
          saved <= 0 ||
          saved > props.entity.amount
        ) {
          throw new Error(
            "Validation error. Invalid provider recurring amount",
          );
        }
        recurringAmount = saved;
      }
      const stripeMinorAmount = providerMinorUnits(
        recurringAmount,
        currencyPrecision(props.currency),
      );
      const firstOnlyMinorAmount =
        providerMinorUnits(
          props.entity.amount,
          currencyPrecision(props.currency),
        ) - stripeMinorAmount;
      const recurringInterval =
        props.entity.interval === "four_weeks" ? "week" : props.entity.interval;
      const recurringCount = props.entity.interval === "four_weeks" ? 4 : 1;

      let stripeProduct: any;
      let stripePrice: any;
      let checkout:
        | Stripe.Response<Stripe.Checkout.Session>
        | Stripe.Response<Stripe.Subscription>
        | undefined;

      if (props.entity.type === "subscription") {
        if (!props.entity.interval) {
          throw new Error(
            "Validation error. Interval is required for subscription",
          );
        }
        stripeProduct = await stripe.products.search({
          query: `name:'${props.entity.amount}' AND active:'true'`,
        });

        if (!stripeProduct?.data?.length) {
          stripeProduct = await stripe.products.create({
            name: `${props.entity.amount}`,
            default_price_data: {
              unit_amount: stripeMinorAmount,
              currency: props.currency,
              recurring: {
                interval: recurringInterval as any,
                interval_count: recurringCount,
              },
            },
          });
        } else {
          stripeProduct = stripeProduct.data[0];
        }

        const priceQuery = await stripe.prices.list({
          product: stripeProduct.id,
          active: true,
          currency: props.currency,
          limit: 100,
        });

        const filteredPrices = priceQuery.data.filter((price) => {
          return (
            price.recurring &&
            price.recurring.interval === recurringInterval &&
            price.recurring.interval_count === recurringCount &&
            price.unit_amount === stripeMinorAmount
          );
        });

        if (filteredPrices.length) {
          stripePrice = filteredPrices[0];
        } else {
          stripePrice = await stripe.prices.create({
            unit_amount: stripeMinorAmount,
            currency: props.currency,
            recurring: {
              interval: recurringInterval as any,
              interval_count: recurringCount,
            },
            product: stripeProduct.id,
          });
        }

        let customer: Stripe.Customer | undefined;
        const customers = await stripe.customers.list({
          email: props.email,
          limit: 1,
        });

        if (!customers?.data?.length) {
          customer = await stripe.customers.create({
            email: props.email,
          });
        } else {
          customer = customers.data[0];
        }

        if (!customer) {
          throw new Error("Not Found error. Customer not found");
        }

        checkout = await stripe.subscriptions.create(
          {
            customer: customer.id,
            items: [{ price: stripePrice.id }],
            payment_behavior: "default_incomplete",
            expand: ["latest_invoice.payment_intent"],
            metadata: {
              ...props.metadata,
            },
            ...(firstOnlyMinorAmount > 0
              ? {
                  add_invoice_items: [
                    {
                      price_data: {
                        currency: props.currency,
                        product: stripeProduct.id,
                        unit_amount: firstOnlyMinorAmount,
                      },
                      quantity: 1,
                    },
                  ],
                }
              : {}),
          },
          { idempotencyKey: `sps:${props.entity.id}:subscription` },
        );
      } else {
        stripeProduct = await stripe.products.search({
          query: `name:'${props.entity.amount}' AND active:'true'`,
        });

        if (!stripeProduct?.data?.length) {
          stripeProduct = await stripe.products.create({
            name: `${props.entity.amount}`,
          });
        } else {
          stripeProduct = stripeProduct.data[0];
        }

        const prices = await stripe.prices.list({
          product: stripeProduct.id,
          active: true,
          currency: props.currency,
          limit: 100,
        });

        const matchingPrice = prices.data.find(
          (price) =>
            price.unit_amount === stripeMinorAmount && !price.recurring,
        );
        if (matchingPrice) {
          stripePrice = matchingPrice;
        } else {
          stripePrice = await stripe.prices.create({
            unit_amount: stripeMinorAmount,
            currency: props.currency,
            product: stripeProduct.id,
          });
        }

        checkout = await stripe.checkout.sessions.create(
          {
            line_items: [{ price: stripePrice.id, quantity: 1 }],
            mode: "payment",
            customer_email: props.email,
            success_url: `${STRIPE_RETURN_URL}`,
            cancel_url: `${STRIPE_RETURN_URL}`,
            metadata: {
              email: props.metadata.email,
              paymentIntentId: props.metadata.paymentIntentId,
            },
          },
          { idempotencyKey: `sps:${props.entity.id}:checkout` },
        );
      }

      if (!checkout) {
        throw new Error("Not Found error. Checkout not found");
      }

      if ("url" in checkout && checkout.url)
        return this.withStripeInvoice(
          {
            paymentIntentId: props.entity.id,
            amount: props.entity.amount,
            currency: props.currency,
            providerId: checkout.id,
            paymentUrl: checkout.url,
            successUrl: checkout.success_url,
            cancelUrl: checkout.cancel_url,
          },
          async (invoice) => invoice,
        );
      if (
        "latest_invoice" in checkout &&
        checkout.latest_invoice &&
        typeof checkout.latest_invoice !== "string"
      )
        return this.withStripeInvoice(
          {
            paymentIntentId: props.entity.id,
            amount: props.entity.amount,
            currency: props.currency,
            providerId: checkout.latest_invoice.id,
            paymentUrl: checkout.latest_invoice.hosted_invoice_url || "",
          },
          async (invoice) => invoice,
        );
      throw new Error("Not Found error. Stripe invoice not found");
    } else {
      const data = props.data.data.object;

      if (data.object === "checkout.session") {
        const invoices = await this.billingModule.invoice.find({
          params: {
            filters: {
              and: [
                { column: "provider", method: "eq", value: "stripe" },
                { column: "providerId", method: "eq", value: data.id },
              ],
            },
          },
        });

        if (!invoices?.length) {
          throw new Error("Not Found error. Invoice not found");
        }

        if (invoices.length !== 1)
          throw new Error("Conflict error. Multiple invoices found");
        return this.applyStripePaymentStatus(invoices[0], data, {
          failedAsyncPayment:
            props.data.type === "checkout.session.async_payment_failed",
        });
      } else if (data.object === "invoice") {
        const reference = data.parent?.subscription_details?.subscription;
        const subscriptionId =
          reference ?? ("subscription" in data ? data.subscription : undefined);
        if (typeof subscriptionId === "string") {
          return this.receiveInitialStripeInvoice(stripe, data);
        }
      }

      throw new Error("Validation error. Unknown stripe webhook data");
    }
  }

  async checkCloudpaymentsInvoice(invoice: IInvoice) {
    if (!RBAC_SECRET_KEY) {
      throw new Error("Configuration error. RBAC secret key not found");
    }
    const provider = new Cloudpayments({
      settle: (input) => this.settlePayment(input),
    });
    const payment = await provider.findCompletedPayment(invoice);
    if (payment) {
      await this.settlePayment({
        invoiceId: invoice.id,
        provider: "cloudpayments",
        providerId: invoice.providerId,
        amount: payment.Amount,
      });
      return;
    }

    const expiresBefore = new Date(Date.now() - 24 * 60 * 60 * 1000);
    if (
      ["open", "failed"].includes(invoice.status) &&
      new Date(invoice.createdAt) < expiresBefore
    ) {
      await this.expireInvoice({
        invoiceId: invoice.id,
        provider: "cloudpayments",
        expiresBefore,
      });
    }
  }

  async failUnpaidIntent(id: string, expectedStatus: string) {
    await this.repository.withPaymentIntentLock(id, () =>
      this.markUnpaidIntentFailed(id, expectedStatus),
    );
  }

  protected async markUnpaidIntentFailed(id: string, expectedStatus: string) {
    const current = await this.findById({ id });
    if (
      !current ||
      current.status !== expectedStatus ||
      ["succeeded", "requires_reconciliation", "canceled"].includes(
        current.status,
      )
    ) {
      return false;
    }
    await this.repository.consumeFirstByField(
      "id",
      id,
      { status: "failed" },
      {
        and: [{ column: "status", method: "eq", value: expectedStatus }],
      },
    );
    return true;
  }

  async cloudpayments(props: ICloudpaymentsProceedProps) {
    const cloudpayments = new Cloudpayments({
      settle: (input) => this.settlePayment(input),
    });
    return cloudpayments.proceed(props);
  }

  async tiptoppay(props: ITiptippayProceedProps) {
    const tiptoppay = new Tiptoppay({
      settle: (input) => this.settlePayment(input),
    });
    return tiptoppay.proceed(props);
  }

  async OxProcessing(
    props:
      | {
          entity: (typeof Table)["$inferSelect"];
          action: "create";
          email: string;
          metadata: {
            paymentIntentId: string;
          };
        }
      | {
          action: "webhook";
          data: {
            PaymentId: number;
            MerchantId: string;
            Amount: number;
            TotalAmount: number;
            Currency: string;
            Email: string;
            Status: "Success" | "Canceled" | "Insufficient";
            Signature: string;
            BillingID: string;
            AmountUSD: number;
            TotalAmountUSD: number;
            Insufficient: boolean;
            Test: boolean;
            ClientId: string;
            TxHashes: string[];
          };
        },
  ) {
    if (!RBAC_SECRET_KEY) {
      throw new Error("Configuration error. RBAC secret key not found");
    }

    if (!O_X_PROCESSING_SHOP_ID) {
      throw new Error("Configuration error. 0xProcessing shop id not found");
    }

    if (!O_X_PROCESSING_WEBHOOK_PASSWORD) {
      throw new Error(
        "Configuration error. 0xProcessing webhook password not found",
      );
    }

    if (props.action === "create") {
      const formData = new FormData();

      formData.append("currency", "USDT");
      formData.append("amountusd", `${props.entity.amount}`);
      formData.append("BillingId", `${props.metadata.paymentIntentId}`);
      formData.append("ClientId", `${props.email}`);
      formData.append("MerchantId", `${O_X_PROCESSING_SHOP_ID}`);
      formData.append("email", `${props.email}`);
      formData.append("ReturnUrl", `${true}`);
      formData.append("SuccessUrl", `${O_X_PROCESSING_RETURN_URL}`);
      formData.append("CancelUrl", `${O_X_PROCESSING_RETURN_URL}`);

      if (O_X_PROCESSING_TEST_PAYMENTS) {
        formData.append("test", `${true}`);
      }

      const response = await fetch("https://app.0xProcessing.com/Payment", {
        method: "POST",
        body: formData,
      });
      const checkout = z
        .object({ redirectUrl: z.httpUrl(), id: z.number() })
        .parse(await response.json());

      logger.debug("🚀 ~ checkout:", checkout);

      const invoice = await invoiceApi.create({
        data: {
          amount: props.entity.amount,
          status: "open",
          providerId: `${checkout.id}`,
          paymentUrl: checkout.redirectUrl,
          successUrl: O_X_PROCESSING_RETURN_URL,
          cancelUrl: O_X_PROCESSING_RETURN_URL,
          provider: "0xprocessing",
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
        },
      });

      if (!invoice) {
        throw new Error("Not Found error. Invoice not found");
      }

      await paymentIntentsToInvoicesApi.create({
        data: {
          paymentIntentId: props.entity.id,
          invoiceId: invoice.id,
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
        },
      });

      return invoice;
    } else {
      const { Signature, PaymentId, Email, Currency } = props.data;

      const invoices = await invoiceApi.find({
        params: {
          filters: {
            and: [
              {
                column: "providerId",
                method: "eq",
                value: PaymentId,
              },
            ],
          },
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
            "Cache-Control": "no-store",
          },
        },
      });

      if (!invoices?.length) {
        throw new Error("Not Found error. Invoice not found");
      }

      if (invoices.length > 1) {
        throw new Error("Validation error. Multiple invoices found");
      }

      let invoice = invoices[0];

      const string = `${PaymentId}:${O_X_PROCESSING_SHOP_ID}:${Email}:${Currency}:${O_X_PROCESSING_WEBHOOK_PASSWORD}`;

      const hash = crypto.createHash("md5").update(string).digest("hex");

      if (hash !== Signature) {
        throw new Error("Validation error. Signature mismatch");
      }

      if (props.data.Status === "Success") {
        invoice = await this.settlePayment({
          invoiceId: invoice.id,
          provider: "0xprocessing",
          providerId: String(PaymentId),
          amount: Number(props.data.AmountUSD),
        });
      }

      return invoice;
    }
  }

  async dummy(
    props:
      | {
          entity: (typeof Table)["$inferSelect"];
          action: "create";
        }
      | {
          action: "webhook";
          data: {
            id: string;
          };
        },
  ) {
    if (!RBAC_SECRET_KEY) {
      throw new Error("Configuration error. RBAC secret key not found");
    }

    if (props.action === "create") {
      const randomString = Math.random().toString(36).substring(7);
      const invoice = await invoiceApi.create({
        data: {
          amount: props.entity.amount,
          status: "open",
          providerId: `${randomString}`,
          paymentUrl: NEXT_PUBLIC_HOST_SERVICE_URL,
          successUrl: NEXT_PUBLIC_HOST_SERVICE_URL,
          cancelUrl: NEXT_PUBLIC_HOST_SERVICE_URL,
          provider: "dummy",
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
        },
      });

      if (!invoice) {
        throw new Error("Not Found error. Invoice not found");
      }

      await paymentIntentsToInvoicesApi.create({
        data: {
          paymentIntentId: props.entity.id,
          invoiceId: invoice.id,
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
        },
      });

      return invoice;
    } else {
      const invoices = await invoiceApi.find({
        params: {
          filters: {
            and: [
              {
                column: "id",
                method: "eq",
                value: props.data.id,
              },
            ],
          },
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
            "Cache-Control": "no-store",
          },
        },
      });

      if (!invoices?.length) {
        throw new Error("Not Found error. Invoice not found");
      }

      if (invoices.length > 1) {
        throw new Error("Validation error. Multiple invoices found");
      }

      let invoice = invoices[0];

      if (invoice.provider !== "dummy") {
        throw new Error(
          "Permission error. Invoice belongs to another payment provider",
        );
      }

      invoice = await this.settlePayment({
        invoiceId: invoice.id,
        provider: "dummy",
        amount: invoice.amount,
      });

      return invoice;
    }
  }

  async payselection(
    props:
      | {
          entity: (typeof Table)["$inferSelect"];
          credentialsType: "INT" | "RUB";
          action: "create";
          email: string;
        }
      | {
          action: "webhook";
          data: {
            Event: "Payment";
            Amount: string;
            Currency: string;
            DateTime: string;
            IsTest: number;
            Brand: string;
            Bank: string;
            Country_Code_Alpha2: string;
            TransactionId: string;
            OrderId: string;
            Description: string;
            CustomFields: string;
            Service_Id: string;
            PaymentMethod: string;
            CardMasked: string;
            ExpirationDate: string;
            CardHolder: string;
          };
          rawBody: string;
          headers: {
            "x-site-id": string;
            "x-webhook-signature": string;
          };
        },
  ) {
    if (!RBAC_SECRET_KEY) {
      throw new Error("Configuration error. RBAC secret key not found");
    }

    let PAYSELECTION_PUBLIC_KEY: string | undefined;
    let PAYSELECTION_SITE_ID: string | undefined;
    let PAYSELECTION_SITE_NAME: string | undefined;
    let PAYSELECTION_WEBHOOK_URL: string | undefined;
    let PAYSELECTION_SECRET_KEY: string | undefined;

    if (props.action === "create") {
      if (props.credentialsType === "RUB") {
        if (!PAYSELECTION_RUB_PUBLIC_KEY) {
          throw new Error(
            "Configuration error. Payselection RUB public key not found",
          );
        }

        if (!PAYSELECTION_RUB_SECRET_KEY) {
          throw new Error(
            "Configuration error. Payselection RUB secret key not found",
          );
        }

        if (!PAYSELECTION_RUB_SITE_ID) {
          throw new Error(
            "Configuration error. Payselection RUB site id not found",
          );
        }

        if (!PAYSELECTION_RUB_SITE_NAME) {
          throw new Error(
            "Configuration error. Payselection RUB site name not found",
          );
        }

        if (!PAYSELECTION_RUB_WEBHOOK_URL) {
          throw new Error(
            "Configuration error. Payselection RUB webhook url not found",
          );
        }

        PAYSELECTION_SECRET_KEY = PAYSELECTION_RUB_SECRET_KEY;
        PAYSELECTION_SITE_ID = PAYSELECTION_RUB_SITE_ID;
        PAYSELECTION_SITE_NAME = PAYSELECTION_RUB_SITE_NAME;
        PAYSELECTION_WEBHOOK_URL = PAYSELECTION_RUB_WEBHOOK_URL;
        PAYSELECTION_PUBLIC_KEY = PAYSELECTION_RUB_PUBLIC_KEY;
      } else if (props.credentialsType === "INT") {
        if (!PAYSELECTION_INT_PUBLIC_KEY) {
          throw new Error(
            "Configuration error. Payselection INT public key not found",
          );
        }

        if (!PAYSELECTION_INT_SITE_ID) {
          throw new Error(
            "Configuration error. Payselection INT site id not found",
          );
        }

        if (!PAYSELECTION_INT_SECRET_KEY) {
          throw new Error(
            "Configuration error. Payselection INT secret key not found",
          );
        }

        if (!PAYSELECTION_INT_SITE_NAME) {
          throw new Error(
            "Configuration error. Payselection INT site name not found",
          );
        }

        if (!PAYSELECTION_INT_WEBHOOK_URL) {
          throw new Error(
            "Configuration error. Payselection INT webhook url not found",
          );
        }

        PAYSELECTION_SECRET_KEY = PAYSELECTION_INT_SECRET_KEY;
        PAYSELECTION_SITE_ID = PAYSELECTION_INT_SITE_ID;
        PAYSELECTION_SITE_NAME = PAYSELECTION_INT_SITE_NAME;
        PAYSELECTION_WEBHOOK_URL = PAYSELECTION_INT_WEBHOOK_URL;
        PAYSELECTION_PUBLIC_KEY = PAYSELECTION_INT_PUBLIC_KEY;
      }
    } else {
      if (!PAYSELECTION_RUB_SITE_ID && !PAYSELECTION_INT_SITE_ID) {
        throw new Error("Configuration error. Payselection site id not found");
      }

      if (PAYSELECTION_RUB_SITE_ID === props.headers["x-site-id"]) {
        if (!PAYSELECTION_RUB_PUBLIC_KEY) {
          throw new Error(
            "Configuration error. Payselection RUB public key not found",
          );
        }

        if (!PAYSELECTION_RUB_PUBLIC_KEY) {
          throw new Error(
            "Configuration error. Payselection RUB public key not found",
          );
        }

        if (!PAYSELECTION_RUB_SECRET_KEY) {
          throw new Error(
            "Configuration error. Payselection RUB secret key not found",
          );
        }

        if (!PAYSELECTION_RUB_SITE_ID) {
          throw new Error(
            "Configuration error. Payselection RUB site id not found",
          );
        }

        if (!PAYSELECTION_RUB_SITE_NAME) {
          throw new Error(
            "Configuration error. Payselection RUB site name not found",
          );
        }

        if (!PAYSELECTION_RUB_WEBHOOK_URL) {
          throw new Error(
            "Configuration error. Payselection RUB webhook url not found",
          );
        }

        PAYSELECTION_SECRET_KEY = PAYSELECTION_RUB_SECRET_KEY;
        PAYSELECTION_SITE_ID = PAYSELECTION_RUB_SITE_ID;
        PAYSELECTION_SITE_NAME = PAYSELECTION_RUB_SITE_NAME;
        PAYSELECTION_WEBHOOK_URL = PAYSELECTION_RUB_WEBHOOK_URL;
        PAYSELECTION_PUBLIC_KEY = PAYSELECTION_RUB_PUBLIC_KEY;
      } else if (PAYSELECTION_INT_SITE_ID === props.headers["x-site-id"]) {
        if (!PAYSELECTION_INT_PUBLIC_KEY) {
          throw new Error(
            "Configuration error. Payselection INT public key not found",
          );
        }

        if (!PAYSELECTION_INT_SITE_ID) {
          throw new Error(
            "Configuration error. Payselection INT site id not found",
          );
        }

        if (!PAYSELECTION_INT_SECRET_KEY) {
          throw new Error(
            "Configuration error. Payselection INT secret key not found",
          );
        }

        if (!PAYSELECTION_INT_SITE_NAME) {
          throw new Error(
            "Configuration error. Payselection INT site name not found",
          );
        }

        if (!PAYSELECTION_INT_WEBHOOK_URL) {
          throw new Error(
            "Configuration error. Payselection INT webhook url not found",
          );
        }

        PAYSELECTION_SECRET_KEY = PAYSELECTION_INT_SECRET_KEY;
        PAYSELECTION_SITE_ID = PAYSELECTION_INT_SITE_ID;
        PAYSELECTION_SITE_NAME = PAYSELECTION_INT_SITE_NAME;
        PAYSELECTION_WEBHOOK_URL = PAYSELECTION_INT_WEBHOOK_URL;
        PAYSELECTION_PUBLIC_KEY = PAYSELECTION_INT_PUBLIC_KEY;
      }
    }

    if (!PAYSELECTION_PUBLIC_KEY) {
      throw new Error("Configuration error. Payselection public key not found");
    }

    if (!PAYSELECTION_SECRET_KEY) {
      throw new Error("Configuration error. Payselection secret key not found");
    }

    if (!PAYSELECTION_SITE_ID) {
      throw new Error("Configuration error. Payselection site id not found");
    }

    if (!PAYSELECTION_SITE_NAME) {
      throw new Error("Configuration error. Payselection site name not found");
    }

    if (props.action === "create") {
      if (!props.entity.amount) {
        throw new Error("Validation error. Amount is required");
      }

      if (props.entity.amount < 0) {
        throw new Error("Validation error. Amount cannot be negative");
      }

      const invoice = await invoiceApi.create({
        data: {
          provider: "payselection",
          status: "open",
          amount: props.entity.amount,
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
        },
      });

      const payload = JSON.stringify({
        PaymentRequest: {
          OrderId: invoice.id,
          Amount: `${props.entity.amount}`,
          Currency: "RUB",
          Description: `Checkout invoice id: ${invoice.id}`,
          RebillFlag: false,
          CustomerInfo: {
            Email: props.email,
            ReceiptEmail: props.email,
          },
          ExtendedData: {
            Email: {
              enabled: true,
              required: true,
            },
          },
        },
      });

      const method = "POST";
      const signature = crypto
        .createHmac("sha256", PAYSELECTION_PUBLIC_KEY)
        .update(
          `${method}\n${PAYSELECTION_SITE_NAME}\n${PAYSELECTION_SITE_ID}\n${invoice.id}\n${payload}`,
        )
        .digest("hex");

      const response = await fetch(
        "https://webform.payselection.com/webpayments/paylink_create",
        {
          method,
          headers: {
            "X-SITE-ID": PAYSELECTION_SITE_ID,
            "X-REQUEST-ID": invoice.id,
            "X-REQUEST-SIGNATURE": signature,
            "Content-Type": "application/json",
          },
          body: payload,
        },
      );
      const checkout = z
        .union([
          z.object({ Id: z.string(), Url: z.httpUrl() }),
          z.object({ Code: z.string(), Description: z.string() }),
        ])
        .parse(await response.json());

      if ("Id" in checkout) {
        const updated = await invoiceApi.update({
          id: invoice.id,
          data: {
            ...invoice,
            status: "open",
            providerId: checkout.Id,
            paymentUrl: checkout.Url,
          },
          options: {
            headers: {
              "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
            },
          },
        });

        if (!updated) {
          throw new Error("Not Found error. Invoice not found");
        }

        await paymentIntentsToInvoicesApi.create({
          data: {
            paymentIntentId: props.entity.id,
            invoiceId: invoice.id,
          },
          options: {
            headers: {
              "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
              "Cache-Control": "no-store",
            },
          },
        });

        return updated;
      }

      throw new Error(
        `Internal error. Payselection error ${checkout.Code} ${checkout.Description}`,
      );
    } else {
      if (!PAYSELECTION_WEBHOOK_URL) {
        throw new Error(
          "Configuration error. PAYSELECTION_WEBHOOK_URL not found",
        );
      }

      const { OrderId } = props.data;

      let invoice = await invoiceApi.findById({
        id: OrderId,
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
            "Cache-Control": "no-store",
          },
        },
      });

      if (!invoice) {
        throw new Error("Not Found error. Invoice not found");
      }

      const signature = crypto
        .createHmac("sha256", PAYSELECTION_SECRET_KEY)
        .update(
          `POST\n${PAYSELECTION_WEBHOOK_URL}\n${PAYSELECTION_SITE_ID}\n${props.rawBody}`,
        )
        .digest("hex");

      if (signature !== props.headers["x-webhook-signature"]) {
        throw new Error("Validation error. Signature mismatch");
      }

      if (props.data.Event === "Payment") {
        invoice = await this.settlePayment({
          invoiceId: invoice.id,
          provider: "payselection",
          providerId: invoice.providerId,
          amount: Number(props.data.Amount),
        });
      }

      return invoice;
    }
  }

  async paykeeper(props: IPaykeeperProceedProps) {
    const paykeeper = new Paykeeper({
      billingModule: this.billingModule,
      settle: (input) => new PaykeeperSettlement(this).execute(input),
    });
    return paykeeper.proceed(props);
  }

  async telegramStar(props: ITelegramStarProps) {
    const telegramStar = new TelegramStar({
      settle: (input) => this.settlePayment(input),
    });
    return telegramStar.proceed(props);
  }
}
