import type { IModel as IOffer } from "@sps/ecommerce/relations/stores-to-products/sdk/model";
import type { IReadService } from "../../../di";

/** Reads trusted, operator-configured registration associations. */
export class Service {
  constructor(readonly offers: Pick<IReadService, "find">) {}

  async find(): Promise<IOffer[]> {
    const offers: IOffer[] = await this.offers.find({
      params: {
        orderBy: {
          and: [
            { column: "createdAt", method: "asc" },
            { column: "id", method: "asc" },
          ],
        },
        filters: {
          and: [
            { column: "settings->>initialGrant", method: "eq", value: "true" },
          ],
        },
      },
    });
    return offers.filter(
      (offer) =>
        offer.settings?.initialGrant === true && offer.variant !== "hidden",
    );
  }

  async includes(productId: string): Promise<boolean> {
    return this.includesAny([productId]);
  }

  async includesAny(
    productIds: string[],
    options: { legacyHistoryOnly?: boolean } = {},
  ): Promise<boolean> {
    if (!productIds.length) {
      return false;
    }
    const offers: IOffer[] = await this.offers.find({
      params: {
        filters: {
          and: [
            { column: "settings->>initialGrant", method: "eq", value: "true" },
            { column: "productId", method: "inArray", value: productIds },
            ...(options.legacyHistoryOnly
              ? [
                  {
                    column: "settings->>initialGrantLegacyHistory",
                    method: "eq",
                    value: "true",
                  },
                ]
              : []),
          ],
        },
      },
    });
    return offers.some(
      (offer) =>
        productIds.includes(offer.productId) &&
        offer.settings?.initialGrant === true &&
        (!options.legacyHistoryOnly ||
          offer.settings.initialGrantLegacyHistory === true),
    );
  }
}
