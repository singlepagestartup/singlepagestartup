import type {
  IOfferQuote,
  IOfferWorkTokenTariff,
} from "@sps/ecommerce/relations/stores-to-products/sdk/model";

export type TWorkKind = "individual-service" | "physical-order";
export type TWorkFulfillmentState =
  | "canceled"
  | "in-progress"
  | "completed"
  | "awaiting-result"
  | "awaiting-payment"
  | "accepted"
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
  paymentMode?: "work-tokens";
  workTokenTariff?: IOfferWorkTokenTariff;
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
  | { kind: "work-tokens" }
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

export interface IOrderWorkFile {
  id: string;
  legacyMessageId?: string;
  actorId: string;
  operationKey: string;
  operationDigest: string;
  createdAt: string;
  originalFileId: string;
  previewFileId: string;
  previewMimeType?: string;
  previewName?: string;
  originalName?: string;
  originalMimeType?: string;
  currencyId: string;
  price: string;
  priceBasis?: TOrderWorkPriceBasis;
  purchaseQuote?: IOrderWorkPurchaseQuote;
  invalidatedByCartEdit?: true;
}

export interface IDecideOrderWorkResult extends IOrderWorkScope {
  fileId: string;
  operationKey: string;
}

export interface IDeclineOrderWorkResult extends IDecideOrderWorkResult {
  reason: string;
}

export interface IOrderWorkDecision {
  fileId: string;
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
  fileId: string | null;
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

interface IOrderWorkExpertSourceSnapshot {
  sourceId: string;
  versionDigest: string;
  title: string;
  content: string;
}

export type IOrderWorkExpertArchive = IOrderWorkExpertSourceSnapshot[];

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

export interface IOrderPaymentConversation {
  fileId: string | null;
  step: "method" | "email" | "comment" | "ready" | "link" | "confirming";
  promptId: string;
  provider?: string;
  emailMessageId?: string;
  commentMessageId?: string;
}

export interface IOrderWorkSharedDocument {
  fileId: string;
  digest: string;
  name: string;
  mimeType: string;
  chatId: string;
  threadId: string;
  messageId: string;
  replyKey: string;
  profileId: string;
  eventId: string;
  eventRevision: number;
  stageId: string;
  assignmentRevision: number;
  publicationId: string;
}

export interface IOrderWork extends IRegisterOrderWork {
  id: string;
  createdAt: string;
  updatedAt: string;
  state: TWorkFulfillmentState;
  files: IOrderWorkFile[];
  decisions: IOrderWorkDecision[];
  acceptedFileId: string | null;
  paid: IOrderWorkPayment | null;
  paymentConversation?: IOrderPaymentConversation;
  sharedDocument?: IOrderWorkSharedDocument;
  expertArchive: IOrderWorkExpertArchive | null;
  deliveredAt: string | null;
  receiptFileId: string | null;
  resultFileId: string | null;
  paidDispatchedAt: string | null;
  fulfillment: IOrderPhysicalEvent[];
}

export function deliveredOrderWorkFile(work: IOrderWork | null | undefined) {
  if (!work?.deliveredAt || !work.resultFileId) {
    return undefined;
  }
  const fileId =
    work.paymentMode === "work-tokens"
      ? work.acceptedFileId
      : work.paid?.fileId;
  return work.files.find(
    (file) =>
      file.id === fileId &&
      file.originalFileId === work.resultFileId &&
      !file.invalidatedByCartEdit,
  );
}
