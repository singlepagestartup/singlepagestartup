import type {
  IUnpricedOrderToProduct,
  IModel as IOrdersToProducts,
} from "@sps/ecommerce/relations/orders-to-products/sdk/model";
import type { IModel as IProduct } from "@sps/ecommerce/models/product/sdk/model";
import type {
  IOfferQuote,
  IModel as IOffer,
} from "@sps/ecommerce/relations/stores-to-products/sdk/model";
import type { IModel as IStore } from "@sps/ecommerce/models/store/sdk/model";
import type { IPurchaseSnapshot } from "@sps/ecommerce/relations/orders-to-billing-module-payment-intents/sdk/model";
import type { IModel as IBillingModuleCurrency } from "@sps/billing/models/currency/sdk/model";
import type { IModel as IFileStorageModuleFile } from "@sps/file-storage/models/file/sdk/model";

export interface ICartDetails {
  maxLineQuantity: number;
  /** Currencies shared by every line; the persisted selection may be stale. */
  availableCurrencyIds?: string[];
  billingModuleCurrencyId?: string;
  unpriced?: IUnpricedOrderToProduct[];
  lines: (IOrdersToProducts & { product: IProduct | null })[];
  totals: { total: number; billingModuleCurrency: IBillingModuleCurrency }[];
  offerQuotes?: IOfferQuote[];
  offers?: (IOffer & { store: IStore | null })[];
}

export interface IPurchaseCharge extends IPurchaseSnapshot {
  orderLineId?: string;
}

/** Subject-scoped order history assembled from invoices, receipts and subscription orders. */
export interface IPurchaseDetails {
  primaryProductSlug?: string;
  /** Whether the Subject may retry an unfinished payment by replacing the cart. */
  canRepeatPayment?: boolean;
  canPayNextPeriod?: boolean;
  nextPeriod?: {
    orderId: string;
    status: string;
    startsAt?: string;
    endsAt?: string;
    paymentUrl?: string;
    totals: { total: number; billingModuleCurrency: IBillingModuleCurrency }[];
    requiresConfirmation: boolean;
  };
  requiresReconciliation?: boolean;
  /** Existing hosted payment page for an open invoice owned by this Subject. */
  paymentUrl?: string;
  unpriced?: IUnpricedOrderToProduct[];
  totals: { total: number; billingModuleCurrency: IBillingModuleCurrency }[];
  receipts: IFileStorageModuleFile[];
  charges?: IPurchaseCharge[];
  invoiceShares?: {
    invoiceId: string;
    invoiceAmount: number;
    amount: number | null;
    currencyId: string;
    orderIds: string[];
    showSharedTotal: boolean;
    status: string;
  }[];
}

export {
  type IInsertSchema,
  type ISelectSchema as IModel,
  insertSchema,
  selectSchema,
} from "@sps/ecommerce/models/order/backend/repository/database";
import {
  API_SERVICE_URL,
  NEXT_PUBLIC_API_SERVICE_URL,
  NextRequestOptions,
  REVALIDATE,
} from "@sps/shared-utils";

export const serverHost = API_SERVICE_URL;
export const clientHost = NEXT_PUBLIC_API_SERVICE_URL;
export const route = "/api/ecommerce/orders";
export const variants = ["hidden", "purchase-ai-chat", "default"];
export const types = ["cart", "history"];
export const statuses = [
  "new",
  "paying",
  "paid",
  "approving",
  "packaging",
  "delivering",
  "delivered",
  "expired",
  "requested_cancelation",
  "canceling",
  "canceled",
  "completed",
];
export const query = {};
export const options = {
  next: {
    revalidate: REVALIDATE,
  },
} as NextRequestOptions;
