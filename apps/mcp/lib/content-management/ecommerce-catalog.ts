import { z } from "zod";
import { api as subjectApi } from "@sps/rbac/models/subject/sdk/server";
import {
  catalogCreateOfferSchema,
  catalogSetAttributeSchema,
} from "@sps/rbac/models/subject/sdk/model/src/lib/ecommerce-catalog";

export const EcommerceOfferCreateInputSchema = z
  .object({
    subjectId: z.uuid(),
    data: catalogCreateOfferSchema,
    dryRun: z.boolean().default(true),
  })
  .strict();
export const EcommerceCatalogAttributeSetInputSchema = z
  .object({
    subjectId: z.uuid(),
    data: catalogSetAttributeSchema,
    dryRun: z.boolean().default(true),
  })
  .strict();

export async function createEcommerceOffer(
  input: unknown,
  authHeaders: Record<string, string>,
) {
  const parsed = EcommerceOfferCreateInputSchema.parse(input);
  if (parsed.dryRun) {
    return {
      operation: "ecommerce-offer-create",
      subjectId: parsed.subjectId,
      data: parsed.data,
      dryRun: true,
    };
  }
  const result = await subjectApi.ecommerceModuleOfferCreate({
    id: parsed.subjectId,
    data: parsed.data,
    options: { headers: authHeaders },
  });
  return result;
}

export async function setEcommerceCatalogueAttribute(
  input: unknown,
  authHeaders: Record<string, string>,
) {
  const parsed = EcommerceCatalogAttributeSetInputSchema.parse(input);
  if (parsed.dryRun) {
    return {
      operation: "ecommerce-catalogue-attribute-set",
      subjectId: parsed.subjectId,
      data: parsed.data,
      dryRun: true,
    };
  }
  const result = await subjectApi.ecommerceModuleCatalogAttributeSet({
    id: parsed.subjectId,
    data: parsed.data,
    options: { headers: authHeaders },
  });
  return result;
}
