export type TWorkKind = "individual-service" | "physical-order";
export type TWorkFulfillmentState =
  | "awaiting-result"
  | "awaiting-payment"
  | "paid"
  | "preparing"
  | "in-transit"
  | "delivered";

export interface IOrderWorkScope {
  storeId: string;
  taskId: string;
  orderId: string;
  customerId: string;
}

export interface IRegisterOrderWork extends IOrderWorkScope {
  kind: TWorkKind;
}

export interface IOrderWorkArtifact {
  name: string;
  mimeType: string;
  bytes: Uint8Array;
}

export interface IPublishOrderWorkResult extends IOrderWorkScope {
  operationKey: string;
  actorId: string;
  currencyId: string;
  price: string;
  priceBasis?: TOrderWorkPriceBasis;
  purchaseQuote?: IOrderWorkPurchaseQuote;
  original: IOrderWorkArtifact;
  preview: IOrderWorkArtifact;
}

export interface IOrderWorkOrderLine {
  id: string;
  offerId: string;
  quantity: number;
  parentLineId: string | null;
}

export interface IOrderWorkPurchaseQuote extends Pick<
  IOfferQuote,
  "charges" | "destination" | "version"
> {
  lines: IOrderWorkOrderLine[];
}

interface IOrderWorkCostConversion {
  fromCurrencyId: string;
  toCurrencyId: string;
  rate: string;
  source: string;
  observedAt: string;
}

export type TOrderWorkPriceBasis = {
  publicationId: string;
  stageId: string;
  quotedAt: string;
} & (
  | { kind: "offer"; quoteVersion: string }
  | { kind: "cart-price" }
  | {
      kind: "confirmed-cost";
      multiplier: string;
      precision: number;
      rounding: "half-up";
      costs: Array<{
        currencyId: string;
        amount: string;
        reservationIds: string[];
        conversion?: IOrderWorkCostConversion;
      }>;
    }
);

export interface IOrderWorkVersion {
  id: string;
  number: number;
  actorId: string;
  operationKey: string;
  operationDigest: string;
  createdAt: string;
  originalFileId: string;
  previewFileId: string;
  currencyId: string;
  price: string;
  priceBasis?: TOrderWorkPriceBasis;
  purchaseQuote?: IOrderWorkPurchaseQuote;
}

export interface IDecideOrderWorkResult extends IOrderWorkScope {
  resultVersionId: string;
  operationKey: string;
}

export interface IDeclineOrderWorkResult extends IDecideOrderWorkResult {
  reason: string;
}

export interface IOrderWorkDecision {
  resultVersionId: string;
  operationKey: string;
  receivedAt: string;
  kind: "accepted" | "declined";
  reason?: string;
}

export interface IOrderWorkCheckout {
  orderId: string;
  customerId: string;
  taskId: string;
  storeId: string;
  resultVersionId: string | null;
  currencyId: string;
  price: string;
}

export interface IAcceptedOrderWorkCheckout {
  checkout: IOrderWorkCheckout;
  purchaseQuote?: IOrderWorkPurchaseQuote;
}

export interface IOrderWorkPayment extends IOrderWorkCheckout {
  id: string;
  paymentIntentId: string;
  invoiceId: string;
  paidAt: string;
}

export interface IOrderPhysicalEvidence extends IOrderWorkScope {
  operationKey: string;
  actorId: string;
  stage: "preparing" | "in-transit" | "delivered";
  trackingNumber?: string;
  carrierEvidenceId?: string;
}

export interface IOrderPhysicalEvent {
  id: string;
  operationKey: string;
  actorId: string;
  createdAt: string;
  stage: IOrderPhysicalEvidence["stage"];
  trackingNumber?: string;
  carrierEvidenceId?: string;
}
import type { IOfferQuote } from "@sps/ecommerce/relations/stores-to-products/sdk/model";
