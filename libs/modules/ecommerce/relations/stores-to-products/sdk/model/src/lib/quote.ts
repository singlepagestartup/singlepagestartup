export interface IOfferDestination {
  address?: string;
  region?: string;
  pickupPointId?: string;
  coordinates?: { latitude: number; longitude: number };
}
export interface IOfferServiceSelection {
  offerId: string;
  quantity: number;
  lineId?: string;
}
export interface IOfferQuoteInput {
  offerId: string;
  quantity: number;
  currencyId: string;
  lineId?: string;
  destination?: IOfferDestination;
  services?: IOfferServiceSelection[];
}
export interface IOfferQuoteIssue {
  code: string;
  offerId: string;
  message: string;
  available?: number;
}
export interface IOfferCharge {
  offerId: string;
  productId: string;
  storeId: string;
  providerStoreId: string;
  lineId?: string;
  role: "product" | "delivery" | "add-on";
  recurrence: "first" | "each";
  quantity: number;
  stockQuantity: number | null;
  availableQuantity: number | null;
  amount: string;
  formula: string;
  formulaVersion: string;
  inputs: Record<string, string>;
}
export interface IOfferServiceOption {
  offerId: string;
  productId: string;
  title: string;
  titles?: Partial<Record<string, string>>;
  role: "delivery" | "add-on";
  receiptMethod?: "shipping" | "pickup" | "electronic";
  pickupPointIds?: string[];
  regionIds?: string[];
  currencyIds: string[];
}
export interface IOfferQuote {
  offerId: string;
  productId: string;
  storeId: string;
  currencyId: string;
  quantity: number;
  amount: string | null;
  availableQuantity: number | null;
  currencyIds: string[];
  serviceOptions: IOfferServiceOption[];
  charges: IOfferCharge[];
  issues: IOfferQuoteIssue[];
  destination?: IOfferDestination;
  version: string;
  expiresAt: string;
}
