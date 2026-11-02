import type { Service as InvoiceService } from "@sps/billing/models/invoice/backend/app/api/src/lib/service";

export interface IReadService {
  find: (props?: any) => Promise<any>;
  findById: (props: { id: string }) => Promise<any>;
}

export interface IBillingModule {
  currency: IReadService;
  invoice: Pick<
    InvoiceService,
    "find" | "findById" | "update" | "lockForSettlement"
  >;
  paymentIntentsToInvoices: IReadService;
}

export const PaymentIntentDI = {
  IBillingModule: Symbol.for("billing.payment-intent.billing.module"),
};
