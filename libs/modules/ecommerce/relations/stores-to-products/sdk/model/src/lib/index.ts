export type * from "./quote";
export type * from "./address-suggestions";
export {
  getEligibleRetailOffers,
  offerUsesOrderDiscussion,
  selectRetailOffer,
  type IEligibleRetailOffersInput,
  type ISelectRetailOfferInput,
} from "./retail-offer";
export {
  type ISelectSchema as IModel,
  type IInsertSchema,
  offerSettingsSchema,
  insertSchema,
  selectSchema,
} from "@sps/ecommerce/relations/stores-to-products/backend/repository/database";
import {
  API_SERVICE_URL,
  NEXT_PUBLIC_API_SERVICE_URL,
  NextRequestOptions,
  REVALIDATE,
} from "@sps/shared-utils";

export const serverHost = API_SERVICE_URL;
export const clientHost = NEXT_PUBLIC_API_SERVICE_URL;
export const route = "/api/ecommerce/stores-to-products";
export const variants = ["default", "provider", "hidden"] as const;
export const query = {};
export const options = {
  next: {
    revalidate: REVALIDATE,
  },
} as NextRequestOptions;
