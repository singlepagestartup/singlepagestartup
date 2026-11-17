export const variant = "offer-editor";

export interface IOfferStore {
  id: string;
  title: string;
  canEdit: boolean;
}

export interface IOfferProduct {
  id: string;
  title: string;
  kind: "physical" | "digital" | "service";
  type: "one_off" | "subscription";
  formula: string;
  formulaVersion: string;
  canEdit: boolean;
}

export interface IOfferPackage {
  id: string;
  count: string;
  lengthCm: string;
  widthCm: string;
  heightCm: string;
  weightKg: string;
}

export interface IStoreOfferDraft {
  id?: string;
  storeId: string;
  productId: string;
  productMode: "existing" | "new";
  title: string;
  kind: IOfferProduct["kind"];
  type: IOfferProduct["type"];
  formula: string;
  formulaVersion: string;
  sku: string;
  rubPrice: string;
  usdPrice: string;
  stockQuantity: string | null;
  dispatchFee: string;
  ratePerKm: string;
  assemblyRate: string;
  packages: IOfferPackage[];
}

export interface IComponentProps {
  variant?: "offer-editor";
  stores?: IOfferStore[];
  products?: IOfferProduct[];
  draft?: IStoreOfferDraft;
  actorRole?: "owner" | "other-seller" | "buyer" | "admin";
  onSave?: (draft: IStoreOfferDraft) => void | Promise<void>;
}

export interface IComponentPropsExtended extends IComponentProps {}
