import type { IModel as IProduct } from "@sps/ecommerce/models/product/sdk/model";
import type { IModel } from "./index";

export interface IEligibleRetailOffersInput {
  offers: readonly IModel[];
  product: Pick<IProduct, "id" | "kind">;
  storeId?: IModel["storeId"];
}

export interface ISelectRetailOfferInput extends IEligibleRetailOffersInput {
  offerId?: IModel["id"];
}

export function getEligibleRetailOffers({
  offers,
  product,
  storeId,
}: IEligibleRetailOffersInput): IModel[] {
  return offers
    .filter(
      (offer) =>
        Boolean(product.id) &&
        offer.productId === product.id &&
        offer.variant === "default" &&
        offer.settings?.initialGrant !== true &&
        (!storeId || offer.storeId === storeId) &&
        (product.kind !== "service" || offer.settings?.standalone === true),
    )
    .sort((left, right) => {
      const leftTime =
        left.createdAt instanceof Date
          ? left.createdAt.getTime()
          : Date.parse(left.createdAt);
      const rightTime =
        right.createdAt instanceof Date
          ? right.createdAt.getTime()
          : Date.parse(right.createdAt);
      const leftOrder = Number.isFinite(leftTime) ? leftTime : Infinity;
      const rightOrder = Number.isFinite(rightTime) ? rightTime : Infinity;
      if (leftOrder !== rightOrder) {
        return leftOrder < rightOrder ? -1 : 1;
      }
      return left.id < right.id ? -1 : left.id > right.id ? 1 : 0;
    });
}

export function selectRetailOffer({
  offerId,
  ...input
}: ISelectRetailOfferInput): IModel | undefined {
  const offers = getEligibleRetailOffers(input);
  return offerId ? offers.find((offer) => offer.id === offerId) : offers[0];
}
