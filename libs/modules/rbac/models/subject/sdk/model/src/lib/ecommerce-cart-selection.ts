import { z } from "zod";
import type { IOfferQuote } from "@sps/ecommerce/relations/stores-to-products/sdk/model";

export const ecommerceCartSelectionSchema = z
  .object({
    action: z.enum(["preview", "apply", "save"]),
    lineId: z.string().uuid(),
    selections: z
      .array(
        z
          .object({
            offerId: z.string().uuid(),
            quantity: z.number().int().positive(),
            currencyId: z.string().uuid(),
            destination: z
              .object({
                address: z.string().max(2000).optional(),
                region: z.string().max(200).optional(),
                pickupPointId: z.string().max(200).optional(),
                coordinates: z
                  .object({
                    latitude: z.number().min(-90).max(90),
                    longitude: z.number().min(-180).max(180),
                  })
                  .optional(),
              })
              .strict()
              .transform(
                ({ pickupPointId: _legacyPickupPointId, ...destination }) =>
                  destination,
              )
              .optional(),
            services: z
              .array(
                z
                  .object({
                    offerId: z.string().uuid(),
                    quantity: z.number().int().positive(),
                  })
                  .strict(),
              )
              .max(32)
              .optional(),
          })
          .strict(),
      )
      .min(1)
      .max(1),
    expectedVersions: z.array(z.string().min(1)).max(1).optional(),
    expectedSelectionUpdatedAt: z.string().optional(),
  })
  .strict();

export type IEcommerceCartSelectionInput = z.infer<
  typeof ecommerceCartSelectionSchema
>;
export type IEcommerceCartSelection =
  IEcommerceCartSelectionInput["selections"][number];

export interface IEcommerceCartSelectionResult {
  quotes: IOfferQuote[];
  comparisonQuotes?: IOfferQuote[];
  orderIds: string[];
  applied: boolean;
  /** Revision of the original primary line after an immediate save. */
  selectionUpdatedAt?: string;
}
