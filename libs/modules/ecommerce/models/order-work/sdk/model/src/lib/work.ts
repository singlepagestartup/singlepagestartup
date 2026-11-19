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
  original: IOrderWorkArtifact;
  preview: IOrderWorkArtifact;
}

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
