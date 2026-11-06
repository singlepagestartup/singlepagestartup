import {
  paykeeperAmountInMinorUnits,
  type IVerifiedPaykeeperWebhook,
} from "@sps/backend-utils";
import type { Repository } from "../../repository";
import { Service as Settlement } from "./settlement";
import type { Service as PaymentIntentService } from "./index";
import type { IPayKeeperInvoiceData } from "./paykeeper";

export interface IExecuteProps {
  event: IVerifiedPaykeeperWebhook;
  invoiceId: string;
  providerId: string;
  providerInvoice: IPayKeeperInvoiceData;
}

interface IConstructorProps {
  repository: Pick<Repository, "withPaymentIntentLocks">;
  service: Pick<PaymentIntentService, "findById" | "update" | "billingModule">;
}

export class Service {
  constructor(private readonly dependencies: IConstructorProps) {}

  async execute(props: IExecuteProps): Promise<void> {
    const { service, repository } = this.dependencies;
    const { event, providerInvoice } = props;
    await new Settlement({ repository, service }).execute({
      invoiceId: props.invoiceId,
      provider: "paykeeper",
      providerId: props.providerId,
      paymentIntentId: event.orderid,
      amount: event.amountInMinorUnits / 100,
      validate: ({ invoice, paymentIntents }) => {
        const intent = paymentIntents[0];
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
      },
    });
  }
}
