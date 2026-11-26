import { z } from "zod";

export const storeProductLocaleSchema = z
  .string()
  .regex(/^[a-z]{2,3}(?:-[a-zA-Z0-9]{2,8})*$/)
  .max(35);

const featureValue = z.union([
  z.string().trim().max(10000),
  z.record(storeProductLocaleSchema, z.string().trim().max(10000)),
]);

export const storeProductRelationSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("remove-image"), id: z.uuid() }).strict(),
  z
    .object({
      kind: z.literal("move-image"),
      id: z.uuid(),
      direction: z.enum(["up", "down"]).optional(),
      targetId: z.uuid().optional(),
    })
    .strict()
    .refine(
      ({ direction, targetId }) => Boolean(direction) !== Boolean(targetId),
    ),
  z.object({ kind: z.literal("add-category"), categoryId: z.uuid() }).strict(),
  z.object({ kind: z.literal("remove-category"), id: z.uuid() }).strict(),
  z
    .object({
      kind: z.literal("attach-attribute"),
      offerId: z.uuid(),
      attributeId: z.uuid(),
    })
    .strict(),
  z
    .object({
      kind: z.literal("add-attribute"),
      offerId: z.uuid(),
      keyId: z.uuid(),
      value: featureValue,
    })
    .strict(),
  z
    .object({
      kind: z.literal("remove-attribute"),
      id: z.uuid(),
      offerId: z.uuid(),
    })
    .strict(),
  z
    .object({
      kind: z.literal("update-attribute"),
      offerId: z.uuid(),
      id: z.uuid(),
      value: featureValue,
      expectedUpdatedAt: z.iso.datetime(),
    })
    .strict(),
  z
    .object({
      kind: z.literal("remove-price"),
      owner: z.enum(["product", "offer"]),
      offerId: z.uuid().optional(),
      attributeId: z.uuid(),
      currencyId: z.uuid(),
      expectedAmount: z
        .string()
        .max(100)
        .regex(/^(0|[1-9]\d*)(\.\d{1,8})?$/),
    })
    .strict()
    .refine(({ owner, offerId }) => Boolean(offerId) === (owner === "offer")),
]);

export type TStoreProductRelation = z.output<typeof storeProductRelationSchema>;

type TLocalizedText = Record<string, string | undefined>;

export interface IStoreProductImage {
  id: string;
  fileId: string;
  src: string;
  title: string;
  alt: string;
  mimeType: string;
  orderIndex: number;
}

export interface IStoreProductCategoryOption {
  id: string;
  slug: string;
  title: TLocalizedText | null;
  adminTitle: string;
}

export interface IStoreProductCategory extends Omit<
  IStoreProductCategoryOption,
  "id"
> {
  id: string;
  categoryId: string;
}

export interface IStoreProductAttributeOption {
  id: string;
  key: string;
  label: string;
  field: "string" | "number";
}

export interface IStoreProductAttribute {
  id: string;
  attributeId: string;
  key: string;
  label: string;
  field: string;
  type: string;
  value: string | TLocalizedText | null;
  editable: boolean;
  updatedAt: string;
  offerId?: string;
}

export interface IStoreProductRelatedWidget {
  id: string;
  widgetId: string;
  title: string;
  kind: "presentation" | "catalog";
}

export interface IStoreProductFunnel {
  id: string;
  slug: string;
  title: string;
}

export interface IStoreProductRelations {
  images: IStoreProductImage[];
  categories: IStoreProductCategory[];
  categoryOptions: IStoreProductCategoryOption[];
  attributes: IStoreProductAttribute[];
  attributeOptions: IStoreProductAttributeOption[];
  widgets: IStoreProductRelatedWidget[];
  currencyOptions: { id: string; title: string; symbol: string }[];
}
