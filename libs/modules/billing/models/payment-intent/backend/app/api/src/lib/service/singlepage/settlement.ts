import type { IModel as IInvoice } from "@sps/billing/models/invoice/sdk/model";
import type { ISelectSchema as IPaymentIntent } from "@sps/billing/models/payment-intent/backend/repository/database";
import type { Repository } from "../../repository";
import type { Service as PaymentIntentService } from "./index";
import { moneyMinorUnits } from "@sps/backend-utils";

export interface IExecuteProps {
  invoiceId: string;
  provider: string;
  amount: number;
  providerId?: string | null;
  paymentIntentId?: string;
  settledProviderId?: string;
  validate?: (props: {
    invoice: IInvoice;
    paymentIntents: IPaymentIntent[];
  }) => void;
}

export interface IPaymentLifecycle {
  settle(props: {
    invoiceId: string;
    paymentIntentIds: string[];
    requiresReconciliation?: boolean;
  }): Promise<{ reconciliationPaymentIntentIds: string[] }>;
  canRecordLatePayment?(props: {
    paymentIntentIds: string[];
  }): Promise<boolean>;
  release(props: {
    invoiceId?: string;
    paymentIntentIds: string[];
  }): Promise<void>;
}

export interface IProviderPeriodReceipt {
  provider: string;
  contractPaymentIntentId: string;
  providerSubscriptionId: string;
  providerInvoiceId: string;
  periodStart: string;
  periodEnd: string;
  amount: number;
  currency: string;
  initial: boolean;
  recordedPaymentIntentId?: string;
}

export interface IProviderPeriodResolver {
  (receipt: IProviderPeriodReceipt): Promise<{ paymentIntentId: string }>;
}

export type IExpireProps = { invoiceId: string } & (
  | { provider: string | null; expiresBefore: Date; providerId?: never }
  | { provider: "stripe"; providerId: string; expiresBefore?: never }
);

interface IConstructorProps {
  repository: Pick<Repository, "withPaymentIntentLocks">;
  service: Pick<
    PaymentIntentService,
    "findById" | "update" | "billingModule" | "paymentLifecycle"
  >;
}

export class Service {
  constructor(private readonly dependencies: IConstructorProps) {}

  private async withInvoice<T>(
    props: {
      invoiceId: string;
      provider: string | null;
      paymentIntentId?: string;
    },
    operation: (invoice: IInvoice, intents: IPaymentIntent[]) => Promise<T>,
  ): Promise<T> {
    const { repository, service } = this.dependencies;
    const readLinks = () =>
      service.billingModule.paymentIntentsToInvoices.find({
        params: {
          filters: {
            and: [
              { column: "invoiceId", method: "eq", value: props.invoiceId },
            ],
          },
        },
      });
    const links = await readLinks();
    const ids = [
      ...new Set((links || []).map((link) => link.paymentIntentId)),
    ].sort();
    if (
      !ids.length ||
      (props.paymentIntentId &&
        (ids.length !== 1 || ids[0] !== props.paymentIntentId))
    )
      throw new Error(
        "Conflict error. Invoice payment intent association is missing or ambiguous",
      );
    return repository.withPaymentIntentLocks(ids, async () => {
      await service.billingModule.invoice.lockForSettlement(props.invoiceId);
      const currentLinks = await readLinks();
      const currentIds = [
        ...new Set((currentLinks || []).map((link) => link.paymentIntentId)),
      ].sort();
      if (JSON.stringify(currentIds) !== JSON.stringify(ids))
        throw new Error(
          "Conflict error. Invoice payment intent association changed",
        );
      const invoice = await service.billingModule.invoice.findById({
        id: props.invoiceId,
      });
      if (!invoice) throw new Error("Not Found error. Invoice not found");
      if (invoice.provider !== props.provider)
        throw new Error(
          "Permission error. Invoice belongs to another payment provider",
        );
      const intents: IPaymentIntent[] = [];
      for (const id of ids) {
        const intent = await service.findById({ id });
        if (!intent)
          throw new Error("Not Found error. Payment intent not found");
        intents.push(intent);
      }
      return operation(invoice, intents);
    });
  }

  execute(props: IExecuteProps): Promise<IInvoice> {
    const { service } = this.dependencies;
    return this.withInvoice(props, async (invoice, intents) => {
      if (
        props.providerId !== undefined &&
        invoice.providerId !== props.providerId
      )
        throw new Error("Conflict error. Invoice provider ID changed");
      const canceled =
        invoice.status === "canceled" ||
        intents.some((intent) => intent.status === "canceled");
      if (
        canceled &&
        !(await service.paymentLifecycle?.canRecordLatePayment?.({
          paymentIntentIds: intents.map((intent) => intent.id),
        }))
      ) {
        throw new Error("Conflict error. Payment was canceled");
      }
      const confirmedAmount = moneyMinorUnits(props.amount);
      if (moneyMinorUnits(invoice.amount) !== confirmedAmount) {
        throw new Error(
          "Validation error. Payment amount does not match the invoice",
        );
      }
      let remaining = confirmedAmount;
      for (const intent of intents) {
        const intentAmount = moneyMinorUnits(intent.amount);
        if (intentAmount > remaining) {
          throw new Error(
            "Validation error. Payment amount does not cover the payment intents",
          );
        }
        // Already succeeded intents still consume their share on delivery retries.
        remaining -= intentAmount;
      }
      if (remaining !== 0n) {
        throw new Error(
          "Validation error. Invoice amount differs from its payment intent shares",
        );
      }
      if (
        props.settledProviderId &&
        invoice.providerId &&
        invoice.providerId !== props.settledProviderId
      )
        throw new Error(
          "Conflict error. Invoice is already associated with another payment",
        );
      props.validate?.({ invoice, paymentIntents: intents });
      const fulfillment = await service.paymentLifecycle?.settle({
        invoiceId: invoice.id,
        paymentIntentIds: intents.map((intent) => intent.id),
        requiresReconciliation: canceled,
      });
      const reconciliation = new Set(
        fulfillment?.reconciliationPaymentIntentIds ?? [],
      );
      const paid =
        invoice.status === "paid"
          ? invoice
          : await service.billingModule.invoice.update({
              id: invoice.id,
              data: {
                ...invoice,
                status: "paid",
                ...(props.settledProviderId
                  ? { providerId: props.settledProviderId }
                  : {}),
              },
            });
      if (!paid) throw new Error("Not Found error. Invoice not found");
      for (const intent of intents) {
        const status = reconciliation.has(intent.id)
          ? "requires_reconciliation"
          : "succeeded";
        if (intent.status !== status) {
          const updated = await service.update({
            id: intent.id,
            data: { ...intent, status },
          });
          if (!updated)
            throw new Error("Not Found error. Payment intent not found");
        }
      }
      return paid;
    });
  }

  async closeStripePaymentPage(props: {
    invoiceId: string;
    providerId: string;
  }) {
    const { service } = this.dependencies;
    return this.withInvoice(
      { ...props, provider: "stripe" },
      async (invoice) => {
        if (
          invoice.providerId !== props.providerId ||
          invoice.status !== "open" ||
          !invoice.paymentUrl
        ) {
          return invoice;
        }
        const updated = await service.billingModule.invoice.update({
          id: invoice.id,
          data: { ...invoice, paymentUrl: "" },
        });
        if (!updated) {
          throw new Error("Not Found error. Invoice not found");
        }
        return updated;
      },
    );
  }

  expire(props: IExpireProps): Promise<void> {
    const { service } = this.dependencies;
    return this.withInvoice(props, async (invoice, intents) => {
      if (
        (props.provider === "stripe" &&
          (!props.providerId || props.providerId !== invoice.providerId)) ||
        (props.expiresBefore &&
          new Date(invoice.createdAt) >= props.expiresBefore) ||
        ["paid", "canceled"].includes(invoice.status) ||
        intents.some(
          (intent) =>
            intent.status === "succeeded" || intent.status === "canceled",
        )
      )
        return;
      if (invoice.status !== "failed") {
        const updatedInvoice = await service.billingModule.invoice.update({
          id: invoice.id,
          data: { ...invoice, status: "failed" },
        });
        if (!updatedInvoice) {
          throw new Error("Not Found error. Invoice not found");
        }
      }
      for (const intent of intents) {
        if (intent.status === "failed") {
          continue;
        }
        const links = await service.billingModule.paymentIntentsToInvoices.find(
          {
            params: {
              filters: {
                and: [
                  { column: "paymentIntentId", method: "eq", value: intent.id },
                ],
              },
            },
          },
        );
        const invoiceIds = [...new Set(links.map((link) => link.invoiceId))];
        const invoices = await service.billingModule.invoice.find({
          params: {
            filters: {
              and: [{ column: "id", method: "inArray", value: invoiceIds }],
            },
          },
        });
        if (
          !invoiceIds.length ||
          invoices.length !== invoiceIds.length ||
          invoices.some((linkedInvoice) => linkedInvoice.status !== "failed")
        ) {
          continue;
        }
        const updated = await service.update({
          id: intent.id,
          data: { ...intent, status: "failed" },
        });
        if (!updated) {
          throw new Error("Not Found error. Payment intent not found");
        }
        await service.paymentLifecycle?.release({
          invoiceId: invoice.id,
          paymentIntentIds: [intent.id],
        });
      }
    });
  }
}
