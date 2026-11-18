import { z } from "zod";
import { ECOMMERCE_ORDER_LINE_QUANTITY_BOUNDS as quantityBounds } from "@sps/shared-utils";
import { ecommerceCartSelectionSchema } from "./ecommerce-cart-selection";

const selection = ecommerceCartSelectionSchema.shape.selections.element.shape;

export const ecommerceProductPurchaseSchema = z.object({
  offerId: z.string().max(128).optional(),
  storeId: z.string().max(128).optional(),
  quantity: z
    .number()
    .int()
    .safe()
    .min(quantityBounds.min)
    .max(quantityBounds.max)
    .optional(),
  billingModuleCurrencyId: z.string().max(128).optional(),
  billingModule: z
    .object({
      currency: z.object({ id: z.string().max(128).optional() }).optional(),
    })
    .optional(),
  destination: selection.destination,
  services: selection.services,
  expectedQuoteVersion: z.string().min(1).max(256).optional(),
  comment: z.string().optional(),
});

export const ecommerceOrderCreateSchema = ecommerceProductPurchaseSchema.extend(
  {
    productId: z.string().min(1).max(128),
  },
);

export const ecommerceProductCheckoutSchema =
  ecommerceProductPurchaseSchema.extend({
    provider: z.string().min(1).max(128),
    email: z.string().optional(),
    account: z.string().nullable().optional(),
    productId: z.string().max(128).optional(),
  });

export type IEcommerceProductPurchaseInput = z.infer<
  typeof ecommerceProductPurchaseSchema
>;
export type IEcommerceProductCheckoutInput = z.infer<
  typeof ecommerceProductCheckoutSchema
>;
