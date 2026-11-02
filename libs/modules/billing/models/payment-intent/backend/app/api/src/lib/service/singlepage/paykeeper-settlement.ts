import {
  paykeeperAmountInMinorUnits,
  type IVerifiedPaykeeperWebhook,
} from "@sps/backend-utils";
import type { Repository } from "../../repository";
import type { Service as PaymentIntentService } from "./index";
import type { IPayKeeperInvoiceData } from "./paykeeper";

export interface IExecuteProps {
  event: IVerifiedPaykeeperWebhook;
  invoiceId: string;
  providerId: string;
  providerInvoice: IPayKeeperInvoiceData;
}

interface IConstructorProps {
  repository: Pick<Repository, "withPaymentIntentLock">;
  service: Pick<PaymentIntentService, "findById" | "update" | "billingModule">;
}

export class Service {
  constructor(private readonly dependencies: IConstructorProps) {}

  async execute(props: IExecuteProps): Promise<void> {
    const { service, repository } = this.dependencies;
    const { event, providerInvoice } = props;
    await repository.withPaymentIntentLock(event.orderid, async () => {
      const intent = await service.findById({ id: event.orderid });
      if (!intent) throw new Error("Not Found error. Payment intent not found");
      const links = await service.billingModule.paymentIntentsToInvoices.find({
        params: {
          filters: {
            and: [
              { column: "paymentIntentId", method: "eq", value: event.orderid },
            ],
          },
        },
      });
      if (links?.length !== 1 || links[0].invoiceId !== props.invoiceId)
        throw new Error(
          "Conflict error. PayKeeper invoice association changed or is ambiguous",
        );
      await service.billingModule.invoice.lockForSettlement(props.invoiceId);
      const invoice = await service.billingModule.invoice.findById({
        id: props.invoiceId,
      });
      if (
        !invoice ||
        invoice.provider !== "paykeeper" ||
        invoice.providerId !== props.providerId
      )
        throw new Error(
          "Conflict error. PayKeeper invoice association changed",
        );
      if (intent.status === "canceled" || invoice.status === "canceled")
        throw new Error("Conflict error. PayKeeper payment was canceled");
      if (providerInvoice.status !== "paid")
        throw new Error("Conflict error. PayKeeper payment is not confirmed");
      if (
        String(providerInvoice.id) !== props.providerId ||
        String(providerInvoice.paymentid) !== event.id ||
        providerInvoice.orderid?.toLowerCase() !==
          event.orderid.toLowerCase() ||
        (providerInvoice.clientid ?? "") !== event.clientid ||
        paykeeperAmountInMinorUnits(String(providerInvoice.pay_amount)) !==
          event.amountInMinorUnits ||
        invoice.amount * 100 !== event.amountInMinorUnits ||
        intent.amount * 100 !== event.amountInMinorUnits
      )
        throw new Error(
          "Validation error. PayKeeper payment does not match the invoice",
        );

      // The lock and the existing statuses make delivery retries no-ops after commit.
      if (invoice.status !== "paid")
        await service.billingModule.invoice.update({
          id: invoice.id,
          data: { ...invoice, status: "paid" },
        });
      if (intent.status !== "succeeded")
        await service.update({
          id: intent.id,
          data: { ...intent, status: "succeeded" },
        });
    });
  }
}
