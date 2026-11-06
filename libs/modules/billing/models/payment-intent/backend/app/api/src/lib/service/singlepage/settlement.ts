import type { IModel as IInvoice } from "@sps/billing/models/invoice/sdk/model";
import type { IModel as IPaymentIntent } from "@sps/billing/models/payment-intent/sdk/model";
import type { Repository } from "../../repository";
import type { Service as PaymentIntentService } from "./index";

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

interface IConstructorProps {
  repository: Pick<Repository, "withPaymentIntentLocks">;
  service: Pick<PaymentIntentService, "findById" | "update" | "billingModule">;
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
      if (
        invoice.status === "canceled" ||
        intents.some((intent) => intent.status === "canceled")
      )
        throw new Error("Conflict error. Payment was canceled");
      if (
        !Number.isSafeInteger(props.amount) ||
        props.amount < 0 ||
        invoice.amount !== props.amount
      )
        throw new Error(
          "Validation error. Payment amount does not match the invoice",
        );
      let remaining = props.amount;
      for (const intent of intents) {
        if (
          !Number.isSafeInteger(intent.amount) ||
          intent.amount < 0 ||
          intent.amount > remaining
        )
          throw new Error(
            "Validation error. Payment amount does not cover the payment intents",
          );
        // Already succeeded intents still consume their share on delivery retries.
        remaining -= intent.amount;
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
        if (intent.status !== "succeeded") {
          const updated = await service.update({
            id: intent.id,
            data: { ...intent, status: "succeeded" },
          });
          if (!updated)
            throw new Error("Not Found error. Payment intent not found");
        }
      }
      return paid;
    });
  }

  expire(props: {
    invoiceId: string;
    provider: string | null;
    expiresBefore: Date;
  }): Promise<void> {
    const { service } = this.dependencies;
    return this.withInvoice(props, async (invoice, intents) => {
      if (
        new Date(invoice.createdAt) >= props.expiresBefore ||
        ["paid", "canceled", "failed"].includes(invoice.status) ||
        intents.some(
          (intent) =>
            intent.status === "succeeded" || intent.status === "canceled",
        )
      )
        return;
      const updatedInvoice = await service.billingModule.invoice.update({
        id: invoice.id,
        data: { ...invoice, status: "failed" },
      });
      if (!updatedInvoice)
        throw new Error("Not Found error. Invoice not found");
      for (const intent of intents) {
        if (intent.status !== "failed") {
          const updated = await service.update({
            id: intent.id,
            data: { ...intent, status: "failed" },
          });
          if (!updated)
            throw new Error("Not Found error. Payment intent not found");
        }
      }
    });
  }
}
