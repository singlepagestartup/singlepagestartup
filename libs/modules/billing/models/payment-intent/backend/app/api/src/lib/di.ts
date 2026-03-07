export interface IReadService {
  find: (props?: any) => Promise<any>;
  findById: (props: { id: string }) => Promise<any>;
}

export interface IBillingModule {
  currency: IReadService;
  invoice: IReadService;
  paymentIntentsToInvoices: IReadService;
}

export const PaymentIntentDI = {
  IBillingModule: Symbol.for("billing.payment-intent.billing.module"),
};
